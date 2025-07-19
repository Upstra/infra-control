#!/bin/bash

# SBOM Generation Script
# This script generates Software Bill of Materials in multiple formats

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

OUTPUT_DIR="sbom"
mkdir -p "$OUTPUT_DIR"

echo -e "${GREEN}🔍 Generating SBOM for infra-control...${NC}"

echo -e "${YELLOW}📄 Generating CycloneDX JSON SBOM...${NC}"
npx @cyclonedx/cdxgen \
  --type js \
  --output "$OUTPUT_DIR/cyclonedx-sbom.json" \
  --print-format json \
  --project-name "infra-control" \
  --project-version "$(node -p "require('./package.json').version")" \
  .

echo -e "${YELLOW}📄 Generating CycloneDX XML SBOM...${NC}"
npx @cyclonedx/cdxgen \
  --type js \
  --output "$OUTPUT_DIR/cyclonedx-sbom.xml" \
  --print-format xml \
  --project-name "infra-control" \
  --project-version "$(node -p "require('./package.json').version")" \
  .

echo -e "${YELLOW}📄 Generating dependency list...${NC}"
cat > "$OUTPUT_DIR/dependencies.txt" << 'EOF'
# Dependencies for infra-control
# Generated on: $(date)
# Project Version: $(node -p "require('./package.json').version")

## Production Dependencies
EOF

node -e "
const pkg = require('./package.json');
console.log('## Production Dependencies');
Object.entries(pkg.dependencies || {}).forEach(([name, version]) => {
  console.log(\`\${name}@\${version}\`);
});
console.log('\\n## Development Dependencies');
Object.entries(pkg.devDependencies || {}).forEach(([name, version]) => {
  console.log(\`\${name}@\${version}\`);
});
" >> "$OUTPUT_DIR/dependencies.txt"

if command -v pnpm &> /dev/null; then
  echo -e "${YELLOW}🔒 Generating security audit report...${NC}"
  pnpm audit --audit-level moderate --json > "$OUTPUT_DIR/security-audit.json" 2>/dev/null || echo "No security issues found or audit failed"
fi

echo -e "${GREEN}✅ SBOM generation completed!${NC}"
echo -e "${GREEN}📁 Files generated in ${OUTPUT_DIR}/ directory:${NC}"
ls -la "$OUTPUT_DIR/"

echo -e "${GREEN}🎯 SBOM files ready for compliance and security analysis!${NC}"