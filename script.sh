#!/bin/bash

declare -A modules=(
  ["servers"]="Server"
  ["vms"]="Vm"
  ["onduleurs"]="Onduleur"
  ["salles"]="Salle"
  ["groupes"]="Groupe"
  ["users"]="User"
  ["roles"]="Role"
  ["ilos"]="Ilo"
)

for folder in "${!modules[@]}"; do
  class="${modules[$folder]}"
  classLower=$(echo "$class" | tr '[:upper:]' '[:lower:]')
  file_path="src/modules/$folder/application/${classLower}.service.ts"

  mkdir -p "$(dirname "$file_path")"

  cat <<EOF > "$file_path"
import { Injectable, Inject } from '@nestjs/common';
import { ${class}RepositoryInterface } from '../domain/interfaces/${classLower}.repository.interface';

@Injectable()
export class ${class}Service {
  constructor(
    @Inject('${class}RepositoryInterface')
    private readonly ${classLower}Repository: ${class}RepositoryInterface,
  ) {}

  create() {
    return this.${classLower}Repository.hello();
  }
}
EOF

  echo "✅ Created: $file_path"
done
