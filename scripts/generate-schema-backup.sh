#!/bin/bash

# Schema Backup Generator Script
# Generates a schema-only backup of the database

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-pg}
DB_USERNAME=${DB_USERNAME:-root}
DB_PASSWORD=${DB_PASSWORD:-root}

command -v pg_dump >/dev/null 2>&1 || { 
    echo -e "${RED}Error: pg_dump is required but not installed.${NC}" >&2
    echo "Install PostgreSQL client tools:"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu: sudo apt-get install postgresql-client"
    exit 1
}

BACKUP_DIR="backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_FILE="${BACKUP_DIR}/schema_backup_${TIMESTAMP}.sql"

mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}Database Schema Backup Generator${NC}"
echo "================================"
echo ""
echo "Database: $DB_NAME@$DB_HOST:$DB_PORT"
echo "Output: $OUTPUT_FILE"
echo ""

# Function to generate schema backup
generate_backup() {
    echo -e "${YELLOW}Generating schema backup...${NC}"
    
    # Set PostgreSQL password
    export PGPASSWORD=$DB_PASSWORD
    
    # Generate schema-only dump
    pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USERNAME" \
        -d "$DB_NAME" \
        --schema-only \
        --no-owner \
        --no-privileges \
        --no-comments \
        --if-exists \
        --clean \
        -f "$OUTPUT_FILE"
    
    local exit_code=$?
    
    # Unset password for security
    unset PGPASSWORD
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✓ Schema backup generated successfully!${NC}"
        echo "  File: $OUTPUT_FILE"
        echo "  Size: $(du -h "$OUTPUT_FILE" | cut -f1)"
        
        # Add header comment to the file
        local temp_file="${OUTPUT_FILE}.tmp"
        {
            echo "--"
            echo "-- PostgreSQL Database Schema Backup"
            echo "-- Generated: $(date)"
            echo "-- Database: $DB_NAME"
            echo "-- Host: $DB_HOST"
            echo "-- Schema only (no data)"
            echo "--"
            echo ""
            cat "$OUTPUT_FILE"
        } > "$temp_file"
        mv "$temp_file" "$OUTPUT_FILE"
        
        return 0
    else
        echo -e "${RED}✗ Failed to generate schema backup${NC}"
        echo "  Error code: $exit_code"
        return 1
    fi
}

# Function to create a TypeORM migration from the backup
create_migration() {
    echo ""
    echo -e "${YELLOW}Creating TypeORM migration (optional)...${NC}"
    read -p "Do you want to create a TypeORM migration file? (y/N) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        local migration_name
        read -p "Enter migration name (e.g., InitialSchema): " migration_name
        
        if [ -z "$migration_name" ]; then
            migration_name="SchemaBackup"
        fi
        
        # Create empty migration
        pnpm typeorm migration:create "src/migrations/${migration_name}"
        
        echo -e "${GREEN}✓ Empty migration created${NC}"
        echo "  You can now manually add the SQL from $OUTPUT_FILE"
    fi
}

# Function to clean old backups
clean_old_backups() {
    echo ""
    echo -e "${YELLOW}Cleaning old backups...${NC}"
    
    # Keep only the last 10 backups
    local backup_count=$(ls -1 "${BACKUP_DIR}"/schema_backup_*.sql 2>/dev/null | wc -l)
    
    if [ "$backup_count" -gt 10 ]; then
        local files_to_delete=$((backup_count - 10))
        ls -1t "${BACKUP_DIR}"/schema_backup_*.sql | tail -n "$files_to_delete" | xargs rm -f
        echo -e "${GREEN}✓ Removed $files_to_delete old backup(s)${NC}"
    else
        echo "  No cleanup needed ($backup_count backups found)"
    fi
}

# Main execution
main() {
    # Check database connection first
    echo -e "${YELLOW}Testing database connection...${NC}"
    export PGPASSWORD=$DB_PASSWORD
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1
    local connection_result=$?
    unset PGPASSWORD
    
    if [ $connection_result -ne 0 ]; then
        echo -e "${RED}✗ Cannot connect to database${NC}"
        echo "  Please check your database credentials in .env"
        exit 1
    fi
    echo -e "${GREEN}✓ Database connection successful${NC}"
    echo ""
    
    # Generate backup
    if generate_backup; then
        # Optional: create migration
        create_migration
        
        # Clean old backups
        clean_old_backups
        
        echo ""
        echo -e "${GREEN}Backup completed successfully!${NC}"
        echo ""
        echo "To restore this schema to a new database:"
        echo "  psql -h [host] -U [user] -d [database] < $OUTPUT_FILE"
        echo ""
        echo "To use in production:"
        echo "  1. Copy to production server"
        echo "  2. Run: psql -h localhost -U postgres -d your_db < $OUTPUT_FILE"
    else
        exit 1
    fi
}

# Run main function
main