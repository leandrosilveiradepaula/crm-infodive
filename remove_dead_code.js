const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const dirFile = path.join(dir, file);
        const dirent = fs.statSync(dirFile);
        if (dirent.isDirectory()) {
            if (!dirFile.includes('node_modules') && !dirFile.includes('.next') && !dirFile.includes('.git')) {
                filelist = walkSync(dirFile, filelist);
            }
        } else {
            if (dirFile.endsWith('.ts') || dirFile.endsWith('.tsx')) {
                filelist.push(dirFile);
            }
        }
    }
    return filelist;
};

const processFiles = () => {
    const rootDir = path.join(__dirname, 'src');
    const files = walkSync(rootDir);
    let totalRemovedLines = 0;

    // Regex for:
    // 1. Commented imports: // import ...
    // 2. Commented declarations: // const ... or // let ... or // var ...
    // 3. Commented functions: // function ...
    // 4. Commented console.logs: // console.log...
    // Also allows optional spaces after //
    const commentedCodeRegex = /^\s*\/\/\s*(import |const |let |var |function |export |console\.log|await |return |if\s*\(|for\s*\().*$/;

    for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');

        const newLines = lines.filter(line => {
            if (commentedCodeRegex.test(line)) {
                return false;
            }
            return true;
        });

        if (newLines.length !== lines.length) {
            fs.writeFileSync(file, newLines.join('\n'), 'utf8');
            totalRemovedLines += (lines.length - newLines.length);
            console.log(`Removed ${lines.length - newLines.length} lines from ${file.replace(rootDir, '')}`);
        }
    }

    console.log(`\nSuccess: Removed a total of ${totalRemovedLines} commented-out code lines across the project.`);
}

processFiles();
