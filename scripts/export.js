import fs from "fs";
import path from "path";

const importStatements = [];
const exportStatements = [];

function formatImportName(folder, fileName) {
  // Format import name based on folder and file names
  const formattedFolder = folder.replace(/[^a-zA-Z0-9]/g, "");
  const formattedFileName = fileName.replace(/[^a-zA-Z0-9]/g, "");

  // Ensure the import name doesn't start with a number
  const importName = `${formattedFolder}${formattedFileName}`;
  return /^\d/.test(importName) ? `_${importName}` : importName;
}

function traverseDirectory(dirPath, parentFolder = "") {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    const fileStats = fs.statSync(filePath);

    if (fileStats.isDirectory()) {
      // Recursive call for subdirectories
      const currentFolder = parentFolder ? `${parentFolder}/${file}` : file;
      traverseDirectory(filePath, currentFolder);
    } else if (file.endsWith(".mdx")) {
      // Create an import statement for the file with formatted name and content path
      const fileName = path.parse(file).name;
      const formattedName = formatImportName(parentFolder, fileName);
      importStatements.push(
        `import ${formattedName} from './${dirPath}/${
          parentFolder ? `${parentFolder}/` : ""
        }${file}';`
      );
      // Create an export statement for the file
      exportStatements.push(`${formattedName},`);
    }
  });
}

function generateExportScript(folderPath = "content") {
  // Check if README.mdx exists in the main content folder
  const mainReadmePath = path.join(folderPath, "README.mdx");
  if (!fs.existsSync(mainReadmePath)) {
    console.error(
      "Warning: README.mdx file should be present inside the content folder."
    );
    return;
  }

  traverseDirectory(folderPath);

  // Check if each folder has an index.mdx file
  const subFolders = fs.readdirSync(folderPath).filter((folder) => {
    const subFolderPath = path.join(folderPath, folder);
    return fs.statSync(subFolderPath).isDirectory();
  });

  for (const subFolder of subFolders) {
    const indexPath = path.join(folderPath, subFolder, "index.mdx");
    if (!fs.existsSync(indexPath)) {
      console.error(
        `Warning: Each folder should have an index.mdx file. Missing in ${subFolder}.`
      );
      return;
    }
  }

  // Write the import and export statements to the index.js file
  const scriptContent = `${importStatements.join(
    "\n"
  )}\n\nexport {\n  ${exportStatements.join("\n  ")}\n};`;

  fs.writeFileSync("index.js", scriptContent, "utf-8");

  console.log("Export script generated at index.js");
}

// Specify the folder path or use the default ('content')
generateExportScript("content");
