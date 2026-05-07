import { Configuration, OpenAIApi } from "openai";
import PDFDocument from "pdfkit";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const { freelancerName, clientName, projectType, rate, deadline } = req.body;

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
  });
  const openai = new OpenAIApi(configuration);

  const prompt = `
Create a professional freelance contract:
Freelancer: ${freelancerName}
Client: ${clientName}
Project: ${projectType}
Rate: ${rate}
Deadline: ${deadline}
Include clauses about payment, scope, and termination.
`;

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    const contractText = completion.data.choices[0].message.content;

    const doc = new PDFDocument();
    let buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      const pdfData = Buffer.concat(buffers);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=contract.pdf");
      res.status(200).send(pdfData);
    });

    doc.text(contractText);
    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating contract");
  }
}
