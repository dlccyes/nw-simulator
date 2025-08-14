import fs from 'fs';
import MarkdownIt from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';

// Custom slugify function to match GitHub's behavior
function githubSlugify(s) {
    return s
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
        .replace(/\s+/g, '-')     // Replace spaces with hyphens
        .replace(/-+/g, '-')      // Replace multiple hyphens with single hyphen
        .trim()
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Configure markdown-it with anchor plugin
const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true
}).use(markdownItAnchor, {
    permalink: false, // Don't add permalink symbols
    permalinkBefore: false,
    permalinkSymbol: '',
    slugify: githubSlugify
});

// Read input markdown file
const markdownContent = fs.readFileSync('manual.md', 'utf8');

// Convert to HTML
const htmlContent = md.render(markdownContent);

// Write to temporary file
fs.writeFileSync('/tmp/manual-content.html', htmlContent);

console.log('Documentation generated successfully!'); 