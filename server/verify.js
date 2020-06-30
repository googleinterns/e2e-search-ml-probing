// Script which verifies that external dependencies (puppeteer) and generated
// files (protobufs) are working correctly.
//
// Run with "make run_verify".

const puppeteer = require("puppeteer")
const demoProto = require("../demo_pb.js")

async function verifyPuppeteerWorks() {
	console.log("  Puppeteer:")
	console.log("    Launching browser.")
	const browser = await puppeteer.launch()
	console.log("    Opening new tab.")
	const page = await browser.newPage()
	console.log("    Going to youtube.com.")
	await page.goto("http://youtube.com/")
	console.log("    Closing browser.")
	await browser.close()
	console.log("  Success.")
	console.log("")
}

function verifyProtobufGenerationWorked() {
	console.log("  Protobufs:")
	console.log("    Creating DemoMessage.")
	const x = new demoProto.DemoMessage()
	x.setOne("hi")
	x.setTwo(99)

	console.log("    Serializing and Deserializing.")
	const y = new demoProto.DemoMessage.deserializeBinary(x.serializeBinary())

	if (y.getOne() != "hi" || y.getTwo() != 99) {
		throw new Error("Serialization failed")
	}

	console.log("    Deserialized data matches original data.")
	console.log("  Success.")
	console.log("")
}

async function verifyAll() {
	console.log("Verifying external dependencies are working:")
	await verifyPuppeteerWorks()
	verifyProtobufGenerationWorked()
}
verifyAll()
