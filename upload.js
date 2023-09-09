// https://web3.storage/docs/reference/js-client-library/?js-lib=browser

require("dotenv").config();

const { Web3Storage, getFilesFromPath } = require("web3.storage");
const Path = require("path");
const { glob } = require("glob");
const { readFile, writeFile, mkdir, rmdir } = require("fs/promises");

const main = async () => {
  // Construct with token and endpoint
  const client = new Web3Storage({ token: process.env.W3_TOKEN });

  // #1: upload images
  const imagePath = "./assets/images";
  const imageFiles = await getFilesFromPath(imagePath, {
    pathPrefix: Path.resolve(process.cwd(), imagePath),
  });
  const imageRootCid = await client.put(imageFiles);

  // #2: update `image` on each json

  const jsonFiles = await glob("./assets/metadata/*.json");

  try {
    await mkdir("./temp");
  } catch (error) {
    console.log("Directory already created");
  }

  for (const jsonFile of jsonFiles) {
    const r = await readFile(jsonFile);
    let metadataObject = JSON.parse(r.toString());

    metadataObject.image = `ipfs://${imageRootCid}${metadataObject.image}`;

    const fileName = jsonFile.split("/").pop();
    try {
      await writeFile(`./temp/${fileName}`, JSON.stringify(metadataObject));
    } catch (error) {
      console.log(error);
    }
  }

  // #3: upload metadata

  const metadataPath = "./temp";
  const metadataFiles = await getFilesFromPath(metadataPath, {
    pathPrefix: Path.resolve(process.cwd(), metadataPath),
  });
  const metadataRootCid = await client.put(metadataFiles);

  // #4: clean up
  await rmdir("./temp", { recursive: true });

  console.log(`[+] IPFS CID: ipfs://${metadataRootCid}`);

  process.exit(0);
};

main();
