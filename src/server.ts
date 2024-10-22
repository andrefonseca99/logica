import express, { Request, Response } from "express";
import fs from "fs";
import axios from "axios";
import { createObjectCsvWriter } from "csv-writer";
import csvParser from "csv-parser";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;
const csvFilePath = path.join(__dirname, "../", "users.csv");

app.use(express.json());
app.use(express.static("public"));

interface User {
  ID: string;
  Name: string;
  Email: string;
  Avatar: string;
}

const sendErrorResponse = (
  res: Response,
  message: string,
  statusCode: number
) => {
  res.status(statusCode).json({ error: message });
};

// Get data from API
app.get("/api/users", async (req: Request, res: Response) => {
  try {
    const response = await axios.get<User[]>(
      "https://random-data-api.com/api/users/random_user?size=10"
    );
    res.json(response.data);
  } catch (error) {
    sendErrorResponse(res, "Erro ao obter usuários", 500);
  }
});

// Create users on CSV
app.post("/api/save", async (req: Request, res: Response) => {
  const data = fs.readFileSync(csvFilePath, "utf-8");
  if (!data) {
    fs.writeFileSync(csvFilePath, "ID,Name,Email,Avatar\n");
  }

  const csvWriter = createObjectCsvWriter({
    path: csvFilePath,
    header: [
      { id: "ID", title: "ID" },
      { id: "Name", title: "Name" },
      { id: "Email", title: "Email" },
      { id: "Avatar", title: "Avatar" },
    ],
    append: true,
  });
  try {
    await csvWriter.writeRecords(req.body);
    res.status(200).json({ message: "Usuário gravado com sucesso!" });
  } catch {
    sendErrorResponse(res, "Erro ao gravar usuário", 500);
  }
});

// Read users from CSV
app.get("/api/read", (req: Request, res: Response) => {
  const results: User[] = [];

  fs.createReadStream(csvFilePath)
    .pipe(csvParser())
    .on("data", (data: User) => {
      results.push(data);
    })
    .on("end", () => {
      res.json(results);
    })
    .on("error", () => {
      sendErrorResponse(res, "Erro ao ler arquivo CSV", 500);
    });
});

// Read users by ID, Name or Email
app.get("/api/search", (req: Request, res: Response) => {
  const term = req.query.term?.toString().toLowerCase();
  if (!term) {
    return sendErrorResponse(res, "Termo de busca é obrigatório", 400);
  }

  const results: User[] = [];

  fs.createReadStream(csvFilePath)
    .pipe(csvParser())
    .on("data", (data: User) => {
      if (
        data.ID.toLowerCase().includes(term) ||
        data.Name.toLowerCase().includes(term) ||
        data.Email.toLowerCase().includes(term)
      ) {
        results.push(data);
      }
    })
    .on("end", () => {
      res.json(results);
    })
    .on("error", () => {
      sendErrorResponse(res, "Erro ao ler arquivo CSV", 500);
    });
});

// Update user on CSV by ID
app.put("/api/edit/:id", async (req: Request, res: Response) => {
  const { Name, Email, Avatar }: User = req.body;
  const ID = req.params.id;

  if (!ID || !Name || !Email || !Avatar) {
    return sendErrorResponse(
      res,
      "ID, Name, Email e Avatar são obrigatórios",
      400
    );
  }

  const results: User[] = [];

  fs.createReadStream(csvFilePath)
    .pipe(csvParser())
    .on("data", (data) => {
      if (data.ID === ID) {
        results.push({ ID, Name, Email, Avatar });
      } else {
        results.push(data);
      }
    })
    .on("end", async () => {
      const csvWriter = createObjectCsvWriter({
        path: csvFilePath,
        header: [
          { id: "ID", title: "ID" },
          { id: "Name", title: "Name" },
          { id: "Email", title: "Email" },
          { id: "Avatar", title: "Avatar" },
        ],
      });
      try {
        await csvWriter.writeRecords(results);
        res.json({ message: "Usuário editado com sucesso!" });
      } catch {
        sendErrorResponse(res, "Erro ao editar usuário", 500);
      }
    })
    .on("error", () => {
      sendErrorResponse(res, "Erro ao editar o arquivo CSV", 500);
    });
});

// Delete user from CSV by ID
app.delete("/api/delete/:id", async (req: Request, res: Response) => {
  const ID = req.params.id;
  const results: User[] = [];

  fs.createReadStream(csvFilePath)
    .pipe(csvParser())
    .on("data", (data: User) => {
      if (data.ID !== ID) results.push(data);
    })
    .on("end", async () => {
      const csvWriter = createObjectCsvWriter({
        path: csvFilePath,
        header: [
          { id: "ID", title: "ID" },
          { id: "Name", title: "Name" },
          { id: "Email", title: "Email" },
          { id: "Avatar", title: "Avatar" },
        ],
      });
      try {
        await csvWriter.writeRecords(results);
        res.json({ message: `Usuário com ID ${ID} deletado com sucesso!` });
      } catch {
        sendErrorResponse(res, `Erro ao deletar usuário com ID ${ID}`, 500);
      }
    })
    .on("error", () => {
      sendErrorResponse(res, "Erro ao deletar usuário", 500);
    });
});

app.delete("/api/clear", async (req: Request, res: Response) => {
  try {
    if (fs.existsSync(csvFilePath)) {
      fs.writeFileSync(csvFilePath, "ID,Name,Email,Avatar\n");
      res.json({ message: "Todos os usuários foram deletados com sucesso!" });
    } else {
      res.status(404).json({ message: "Arquivo de usuários não encontrado!" });
    }
  } catch (error) {
    sendErrorResponse(res, "Erro ao deletar todos os usuários", 500);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

export default app;
