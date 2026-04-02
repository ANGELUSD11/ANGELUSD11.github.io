import fs from 'fs';
import path from 'path';
import readline from 'readline';

// Configuración de rutas (relativas a la raíz del proyecto)
const componentsBlogDir = path.join(process.cwd(), 'src', 'components', 'blog');
const blogIndexFile = path.join(process.cwd(), 'src', 'pages', 'blog', 'index.astro');

// Interfaz para interactuar por línea de comandos
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));

async function main() {
    console.log('\n--- 📝 Creador de Posts de DEVLOG ---\n');

    // 1. Obtener el siguiente número de Post
    let nextPostId = 1;
    let maxId = 0;

    if (fs.existsSync(componentsBlogDir)) {
        const files = fs.readdirSync(componentsBlogDir);
        files.forEach(file => {
            const match = file.match(/^Post(\d+)\.astro$/);
            if (match) {
                const id = parseInt(match[1], 10);
                if (id > maxId) maxId = id;
            }
        });
        nextPostId = maxId + 1;
    } else {
        fs.mkdirSync(componentsBlogDir, { recursive: true });
    }

    console.log(`Detectados ${maxId} posts. Creando configuración para Post${nextPostId}...\n`);

    // 2. Solicitar información al usuario
    const titleEs = await askQuestion('Título en Español: ');
    const titleEn = await askQuestion('Título en Inglés (opcional): ');
    
    // Si no introduce fecha, asume el día de hoy
    const defaultDateEs = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    const defaultDateEn = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date());

    let dateEs = await askQuestion(`Fecha en Español [${defaultDateEs}]: `);
    if (!dateEs.trim()) dateEs = defaultDateEs;

    let dateEn = await askQuestion(`Fecha en Inglés [${defaultDateEn}]: `);
    if (!dateEn.trim()) dateEn = defaultDateEn;

    let color = await askQuestion('Color del badge (info, success, primary, danger, warning) [info]: ');
    if (!color.trim()) color = 'info';

    rl.close();

    // 3. Crear el componente PostN.astro
    const postComponentPath = path.join(componentsBlogDir, `Post${nextPostId}.astro`);
    
    // Plantilla de base para el post
    const postContent = `---
import BlogPost from '../BlogPost.astro';
---
<BlogPost titleEs="${titleEs}" titleEn="${titleEn || titleEs}" dateEs="${dateEs}" dateEn="${dateEn}" color="${color}">

    <!-- Escribe el contenido en Español dentro de data-es y en Inglés dentro de data-en -->
    <p data-es="Contenido en español aquí..."
       data-en="English content here...">
    </p>

    <!-- Botón para expandir más contenido (Opcional) -->
    <!--
    <a class="btn btn-outline-${color} btn-sm mb-3 toggle-btn" data-bs-toggle="collapse"
        href="#post${nextPostId}-content" role="button" aria-expanded="false" aria-controls="post${nextPostId}-content">
        <span data-es="Mostrar más" data-en="Show more"></span> <i class="fas fa-chevron-down"></i>
    </a>

    <div class="collapse" id="post${nextPostId}-content">
        <p data-es="Más contenido..." data-en="More content..."></p>
    </div>
    -->

</BlogPost>
`;

    fs.writeFileSync(postComponentPath, postContent, 'utf8');
    console.log(`\n✅ Archivo creado exitosamente en: src/components/blog/Post${nextPostId}.astro`);

    // 4. Actualizar src/pages/blog/index.astro
    if (fs.existsSync(blogIndexFile)) {
        let indexContent = fs.readFileSync(blogIndexFile, 'utf8');

        // Búsqueda del bloque de imports actual
        const importRegex = /(import\s+Post\d+\s+from\s+['"]\.\.\/\.\.\/components\/blog\/Post\d+\.astro['"];?\s*)/g;
        let lastImportMatch;
        let match;
        while ((match = importRegex.exec(indexContent)) !== null) {
            lastImportMatch = match;
        }

        const newImportStr = `import Post${nextPostId} from '../../components/blog/Post${nextPostId}.astro';\n`;
        
        if (lastImportMatch) {
            const insertPos = lastImportMatch.index + lastImportMatch[0].length;
            indexContent = indexContent.slice(0, insertPos) + newImportStr + indexContent.slice(insertPos);
        } else {
            // Si no hay imports, inyectar al principio del frontmatter
            indexContent = indexContent.replace('---\n', `---\n${newImportStr}`);
        }

        // --- Novedad: Recolectar fechas de todos los posts para ordenarlos ---
        const postsData = [];
        const allPostFiles = fs.readdirSync(componentsBlogDir).filter(f => /^Post\d+\.astro$/.test(f));
        
        for (const file of allPostFiles) {
            const fileId = parseInt(file.match(/^Post(\d+)\.astro$/)[1], 10);
            const content = fs.readFileSync(path.join(componentsBlogDir, file), 'utf8');
            const dateMatch = content.match(/dateEn="([^"]+)"/);
            
            let timestamp = 0;
            if (dateMatch && dateMatch[1]) {
                const parsedDate = Date.parse(dateMatch[1]);
                if (!isNaN(parsedDate)) {
                    timestamp = parsedDate;
                } else {
                    console.warn(`⚠️ No se pudo analizar la fecha del Post${fileId} ("${dateMatch[1]}"). Quedará al final.`);
                }
            }
            postsData.push({ id: fileId, timestamp });
        }

        // Ordenar posts: del más reciente (mayor timestamp) al más antiguo
        postsData.sort((a, b) => b.timestamp - a.timestamp);

        // Generar bloque HTML de tags ordenados
        const newTagsHtml = postsData.map(p => `            <Post${p.id} />`).join('\n');

        // Reemplazar todo lo que hay dentro de <div class="blog-container">...</div>
        const containerStartRegex = /(<div class="blog-container">\s*)/;
        const containerHtmlMatch = indexContent.match(containerStartRegex);
        
        if (containerHtmlMatch) {
            // Encontrar dónde termina la lista de posts cerrando ese div u otras etiquetas
            // Una forma más segura es usar un regex que abarque desde <div class="blog-container"> hasta el </div> de cierre, 
            // asumiendo que solo contiene posts. Pero usemos match para reemplazar todos los tags <PostX /> seguidos.
            const tagsRegex = /(?:[ \t]*<Post\d+\s*\/>[ \t]*\r?\n?)+/g;
            if (tagsRegex.test(indexContent)) {
                // Reemplazamos todos los bloques seguidos de <PostX />
                indexContent = indexContent.replace(tagsRegex, `\n${newTagsHtml}\n        `);
            } else {
                // Si estaba vacío
                const insertPos = indexContent.indexOf(containerHtmlMatch[0]) + containerHtmlMatch[0].length;
                indexContent = indexContent.slice(0, insertPos) + newTagsHtml + "\n" + indexContent.slice(insertPos);
            }
        }

        fs.writeFileSync(blogIndexFile, indexContent, 'utf8');
        console.log(`✅ Archivo actualizado y ordenado: src/pages/blog/index.astro`);
        console.log(`\n¡Todo listo! Los posts fueron ordenados descendentemente según su 'dateEn'.`);
    } else {
        console.error(`❌ No se encontró el archivo ${blogIndexFile}.`);
    }
}

main().catch(console.error);
