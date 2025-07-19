#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const Converter = require('openapi-to-postmanv2');

async function exportPostmanCollection() {
  const port = process.env.PORT || 9821;
  const baseUrl = `http://localhost:${port}`;
  
  try {
    console.log(`Récupération de la documentation OpenAPI depuis ${baseUrl}/docs-json...`);
    const response = await axios.get(`${baseUrl}/docs-json`);
    const openApiDocument = response.data;
    
    console.log('Conversion en collection Postman...');
    
    await new Promise((resolve, reject) => {
      Converter.convert({
        type: 'json',
        data: openApiDocument,
      }, {}, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!result.result) {
          reject(new Error(result.reason ?? 'Échec de la conversion'));
          return;
        }
        
        const filename = 'infra-control.postman_collection.json';
        fs.writeFileSync(filename, JSON.stringify(result.output[0].data, null, 2));
        
        console.log(`Collection Postman exportée avec succès : ${filename}`);
        console.log('\nPour importer dans Postman :');
        console.log('   1. Ouvrir Postman');
        console.log('   2. Cliquer sur "Import"');
        console.log(`   3. Sélectionner le fichier ${filename}`);
        
        resolve();
      });
    });
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('Erreur : Le serveur n\'est pas en cours d\'exécution.');
      console.error('   Lancez d\'abord : pnpm start:dev');
    } else {
      console.error('Erreur :', error.message);
    }
    process.exit(1);
  }
}

exportPostmanCollection();