const fs = require('fs');
const path = require('path');

// Archivos a actualizar
const files = [
  'app/convocatorias/page.tsx',
  'app/manager/[grupo]/page.tsx',
  'app/grupos/[nombre]/page.tsx',
  'app/eventos/[id]/asistentes/page.tsx',
  'app/usuarios/page.tsx'
];

files.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Archivo no encontrado: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf-8');
  const original = content;
  
  // Reemplazos
  content = content.replace(/codigoEstudiante:/g, 'codigoEstudiantil:');
  content = content.replace(/formData\.codigoEstudiante/g, 'formData.codigoEstudiantil');
  content = content.replace(/user\.codigoEstudiante/g, 'user.codigoEstudiantil');
  content = content.replace(/selectedUser\.codigoEstudiante/g, 'selectedUser.codigoEstudiantil');
  content = content.replace(/htmlFor="codigoEstudiante"/g, 'htmlFor="codigoEstudiantil"');
  content = content.replace(/id="codigoEstudiante"/g, 'id="codigoEstudiantil"');
  content = content.replace(/Código del Estudiante/g, 'Código Estudiantil');
  content = content.replace(/handleInputChange\("codigoEstudiante"/g, 'handleInputChange("codigoEstudiantil"');
  content = content.replace(/key: "codigoEstudiante"/g, 'key: "codigoEstudiantil"');
  content = content.replace(/case "codigoEstudiante":/g, 'case "codigoEstudiantil":');
  content = content.replace(/a\.codigoEstudiante/g, 'a.codigoEstudiantil');
  content = content.replace(/u\.codigoEstudiante/g, 'u.codigoEstudiantil');
  
  // Actualizar condiciones para incluir EGRESADO
  content = content.replace(
    /if \(field === "estamento" && value === "EGRESADO"\) \{\s*newData\.codigoEstudiantil = ""\s*\}/g,
    'if (field === "estamento" && value === "EGRESADO") {\n        // Egresados también tienen código estudiantil\n      }'
  );
  
  content = content.replace(
    /\{formData\.estamento === "ESTUDIANTE" && \(/g,
    '{(formData.estamento === "ESTUDIANTE" || formData.estamento === "EGRESADO") && ('
  );
  
  if (content !== original) {
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`✓ Actualizado: ${filePath}`);
  } else {
    console.log(`- Sin cambios: ${filePath}`);
  }
});

console.log('\n✅ Proceso completado');
