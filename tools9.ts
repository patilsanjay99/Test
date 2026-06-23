import fs from 'fs';
import path from 'path';

function getFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.resolve(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else {
      if (fullPath.endsWith('Form.tsx') || fullPath.endsWith('Register.tsx')) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

const files = getFiles('src/pages');
console.log('Total files:', files.length);
files.forEach(f => console.log(f.replace(process.cwd(), '')));
