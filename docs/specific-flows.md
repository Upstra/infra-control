# 📚 Flux spécifiques

Cette section présente des exemples de diagrammes de séquence décrivant des flux internes de l'API.

## 🔐 Authentification 2FA

```mermaid
sequenceDiagram
    participant C as Client
    participant AuthCtrl as Auth Controller
    participant UC as Use Case
    participant DB as PostgreSQL

    C->>AuthCtrl: POST /auth/login
    AuthCtrl->>UC: Vérifie les identifiants
    UC-->>AuthCtrl: Utilisateur validé
    AuthCtrl-->>C: Demande code 2FA
    C->>AuthCtrl: POST /auth/2fa (code)
    AuthCtrl->>UC: Vérifie code
    UC-->>DB: MAJ dernière connexion
    DB-->>UC: OK
    UC-->>AuthCtrl: Jetons JWT
    AuthCtrl-->>C: Access + Refresh token
```

## 🗄️ Processus de migration

```mermaid
sequenceDiagram
    participant CLI as CLI
    participant Migrate as MigrationRunner
    participant DB as PostgreSQL

    CLI->>Migrate: pnpm migration:run
    Migrate->>DB: BEGIN
    Migrate->>DB: Exécute migrations
    DB-->>Migrate: Résultats
    Migrate->>DB: COMMIT
    Migrate-->>CLI: Success
```

## User Role Update Flow

```mermaid
sequenceDiagram
    participant Admin as Admin User
    participant API as RoleController
    participant UseCase as UpdateUserRoleUseCase
    participant UserRepo as UserRepository
    participant RoleRepo as RoleRepository

    Admin->>API: PATCH /roles/users/:userId { roleId }
    API->>UseCase: execute(userId, roleId)
    UseCase->>UserRepo: find user with roles
    UseCase->>RoleRepo: find role by id (if roleId provided)
    UseCase->>UserRepo: countAdmins() (if user is admin)
    alt If user is last admin and removing admin role
        UseCase-->>API: throw CannotDeleteLastAdminException
    else
        UseCase->>UserRepo: save updated user with new roles
        UseCase-->>API: return updated UserResponseDto
    end
```

## Admin Role Creation Flow

```mermaid
sequenceDiagram
    participant Admin as Admin User
    participant API as RoleController
    participant UseCase as CreateRoleUseCase
    participant RoleRepo as RoleRepository
    participant Domain as RoleDomainService

    Admin->>API: POST /roles/admin { name, isAdmin, canCreateServer }
    API->>UseCase: execute(AdminRoleCreationDto)
    UseCase->>RoleRepo: find existing admin role
    alt If admin role exists
        UseCase-->>API: throw AdminRoleAlreadyExistsException
    else
        UseCase->>Domain: toRoleEntity(dto)
        UseCase->>RoleRepo: save new admin role
        UseCase-->>API: return RoleResponseDto
    end
```