import fs from 'fs';
import path from 'path';

const SCREENS = {
    '4_Impact_Center.html': 'ImpactCenter.jsx',
    '2_Operations_Dashboard_List.html': 'OperationsDashboard.jsx',
    '7_Admin_Queue.html': 'AdminQueue.jsx',
    '5_Report_Issue.html': 'ReportIssue.jsx',
    '6_Complaint_Detail_View.html': 'ComplaintDetail.jsx'
};

const screensDir = path.join(process.cwd(), 'screens');
const pagesDir = path.join(process.cwd(), 'client', 'src', 'pages');

if (!fs.existsSync(pagesDir)) {
    fs.mkdirSync(pagesDir, { recursive: true });
}

function htmlToJsx(html) {
    let jsx = html;
    
    // Convert class to className
    jsx = jsx.replace(/class=/g, 'className=');
    // Convert for to htmlFor
    jsx = jsx.replace(/for=/g, 'htmlFor=');
    // Convert self-closing tags
    jsx = jsx.replace(/<input([^>]*?)>/g, '<input$1 />');
    jsx = jsx.replace(/<img([^>]*?)>/g, '<img$1 />');
    jsx = jsx.replace(/<br([^>]*?)>/g, '<br$1 />');
    jsx = jsx.replace(/<hr([^>]*?)>/g, '<hr$1 />');
    // Remove inline style entirely for safety since we're using tailwind mostly:
    // Some lines have style="fontVariationSettings:..." which conflicts. We'll simply strip style= attributes
    jsx = jsx.replace(/style="[^"]*"/g, '');
    
    // Convert comments
    jsx = jsx.replace(/<!--([\s\S]*?)-->/g, '{/*$1*/}');

    return jsx;
}

for (const [htmlFile, jsxFile] of Object.entries(SCREENS)) {
    if (jsxFile !== 'AdminQueue.jsx') continue;
    const htmlPath = path.join(screensDir, htmlFile);
    if (!fs.existsSync(htmlPath)) {
        console.log(`Skipping ${htmlPath}...`);
        continue;
    }

    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Extract the section inside <main>
    let sectionMatch = htmlContent.match(/<section[^>]*>([\s\S]*?)<\/section>/);
    if (!sectionMatch) {
       sectionMatch = htmlContent.match(/<main[^>]*>([\s\S]*?)<\/main>/);
    }
    
    if (sectionMatch) {
        let sectionHtml = sectionMatch[0];
        let jsxContent = htmlToJsx(sectionHtml);
        
        const fileContent = `
export default function ${jsxFile.replace('.jsx', '')}() {
    return (
        <div className="flex-1 overflow-y-auto h-full relative">
            ${jsxContent}
        </div>
    );
}
`;
        fs.writeFileSync(path.join(pagesDir, jsxFile), fileContent, 'utf8');
        console.log(`Created ${jsxFile}`);
    } else {
        console.log(`Could not find <section> or <main> in ${htmlFile}`);
    }
}
