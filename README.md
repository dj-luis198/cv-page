# Página de Currículum Vitae
https://dj-luis198.github.io/cv-page/

Una página web de CV profesional con diseño sidebar, similar al tema de JSON Resume, completamente en español.

## Características

- ✅ Diseño sidebar profesional
- ✅ Completamente en español
- ✅ Descarga de versión PDF
- ✅ Descarga de versión ATS (formato de texto plano optimizado para sistemas ATS)
- ✅ Diseño responsive
- ✅ Fácil de personalizar

## Cómo usar

1. Abre `index.html` en tu navegador
2. Personaliza el contenido editando `index.html` con tu información
3. Usa los botones en la esquina inferior derecha para:
   - **Descargar PDF**: Genera un PDF del CV
   - **Descargar ATS**: Descarga una versión en texto plano optimizada para sistemas de seguimiento de candidatos (ATS)

## Personalización

### Editar información personal

Abre `index.html` y modifica:

- **Foto de perfil**: Reemplaza `src="foto.jpg"` en la sección `.profile-photo` con la ruta a tu foto. La foto debe ser cuadrada (recomendado: 400x400px o más) y se mostrará como un círculo.
- **Nombre y título**: Busca `.main-name` y `.main-title` en el contenido principal (arriba de la sección PERFIL)
- **Contacto**: Edita la sección `.contact` en el sidebar
- **Educación**: Modifica `.education-item` en el sidebar
- **Habilidades**: Actualiza la lista en `.skills` en el sidebar
- **Experiencia laboral**: Edita los elementos `.experience-item` en el contenido principal
- **Proyectos**: Modifica los elementos `.project-item` en el contenido principal

### Cambiar colores

Edita `styles.css` y modifica los colores en la sección `.sidebar`:
- Color de fondo: `background: #2c3e50;`
- Color de acento: `border-bottom: 2px solid #3498db;`

## Tecnologías utilizadas

- HTML5
- CSS3
- JavaScript (Vanilla)
- html2pdf.js (para generación de PDF)

## Notas

- La versión ATS es un archivo de texto plano sin formato, optimizado para ser leído por sistemas de seguimiento de candidatos
- El PDF se genera usando html2pdf.js, que requiere conexión a internet para cargar la librería
- Para mejor compatibilidad con ATS, mantén el formato simple y evita caracteres especiales innecesarios

