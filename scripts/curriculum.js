import fs from "fs";
import path from "path";
import matter from "gray-matter";
import exp from "constants";

function formatImportName(folder, fileName) {
  // Format import name based on folder and file names
  const formattedFolder = folder.replace(/[^a-zA-Z0-9]/g, "");
  const formattedFileName = fileName.replace(/[^a-zA-Z0-9]/g, "");

  // Ensure the import name doesn't start with a number
  const importName = `${formattedFolder}${formattedFileName}`;
  return /^\d/.test(importName) ? `_${importName}` : importName;
}

const generateCurriculum = (directory) => {
  const curriculum = {
    title: "",
    abstract: "",
    lectures: 0,
    duration: 0,
    content: [],
  };

  const processFolder = (folderPath, parent = curriculum.content) => {
    const files = fs.readdirSync(folderPath);

    files.forEach((file) => {
      const filePath = path.join(folderPath, file);
      const isDirectory = fs.statSync(filePath).isDirectory();

      if (isDirectory) {
        const folderName = file.toLowerCase();
        // get the index.mdx file content
        const indexPath = path.join(filePath, "index.mdx");
        const { data } = matter.read(indexPath);
        // generate file name from folder name together. Like this: _001gettingstarted001introduction
        const formattedName = formatImportName(folderName, "index");

        // create a folder item
        const folderItem = {
          ...data,
          file: formattedName,
          chapters: [],
        };
        parent.push(folderItem);
        processFolder(filePath, folderItem.chapters);
      } else if (file.endsWith(".mdx")) {
        const { data } = matter.read(filePath);
        const fileName = path.basename(file, ".mdx");

        // exclude the README.mdx file and index.mdx file from chapters
        if (fileName === "README" || fileName === "index") {
          return;
        }

        // generate file name
        const formattedName = formatImportName(
          `./${path.basename(folderPath)}`,
          fileName
        );

        const chapterItem = { ...data, file: formattedName };
        parent.push(chapterItem);
      }
    });
  };

  // Process the README.md file separately
  const readmePath = path.join(directory, "README.mdx");
  if (fs.existsSync(readmePath)) {
    const { data } = matter.read(readmePath);
    curriculum.title = data.title;
    curriculum.abstract = data.abstract;
    curriculum.lectures = data.lectures;
    curriculum.duration = data.duration;
  }

  processFolder(directory);

  return curriculum;
};

const formattedCurriculum = generateCurriculum("content");
export default formattedCurriculum;

const indexFilePath = path.join(process.cwd(), "index.js");
const indexFileContent = fs.readFileSync(indexFilePath, "utf8");

// import formattedCurriculum
const importStatement = `import formattedCurriculum from "./scripts/curriculum.js";`;

// export formattedCurriculum
const exportStatement = `export default formattedCurriculum;`;

// check if the import statement already exists
if (indexFileContent.includes(importStatement)) {
  console.log("Import statement already exists.");
}

// check if the export statement already exists
if (indexFileContent.includes(exportStatement)) {
  console.log("Export statement already exists.");
}

// append the import statement to the end of the file
fs.appendFileSync(indexFilePath, `\n${importStatement}`, "utf8");

// append the export statement to the end of the file
fs.appendFileSync(indexFilePath, `\n${exportStatement}`, "utf8");

console.log("Curriculum generated at index.js");
