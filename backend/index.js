const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const doc = DynamoDBDocumentClient.from(client);
const TABLE = process.env.TABLE_NAME || "DateNightFund";

// Headers API Gateway must pass to the client for CORS (exact casing)
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};

function json(body, statusCode = 200) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
    },
    body: JSON.stringify(body),
  };
}

function getRoomItem(roomCode) {
  return doc.send(
    new GetCommand({
      TableName: TABLE,
      Key: { RoomCode: roomCode },
    })
  );
}

function putRoomItem(roomCode, logs) {
  return doc.send(
    new PutCommand({
      TableName: TABLE,
      Item: { RoomCode: roomCode, logs },
    })
  );
}

exports.handler = async (event) => {
  const method = event.requestContext?.http?.method || event.httpMethod;
  const path = event.requestContext?.http?.path || event.path || "";

  if (method === "OPTIONS") {
    return {
      statusCode: 204,
      headers: { ...CORS_HEADERS },
      body: "",
    };
  }

  let roomCode =
    event.queryStringParameters?.roomCode ||
    (event.body && JSON.parse(event.body || "{}").roomCode);

  if (!roomCode) {
    return json({ error: "roomCode required" }, 400);
  }

  try {
    if (method === "GET" && path.includes("logs")) {
      const res = await getRoomItem(roomCode);
      const logs = res.Item?.logs ?? [];
      return json({ logs });
    }

    if (method === "POST" && path.includes("logs")) {
      const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
      const { date, you, partner } = body;
      if (!date) return json({ error: "date required" }, 400);
      const res = await getRoomItem(roomCode);
      const logs = res.Item?.logs ?? [];
      const entry = {
        id: Date.now(),
        date: String(date).trim(),
        you: Boolean(you),
        partner: Boolean(partner),
      };
      logs.push(entry);
      await putRoomItem(roomCode, logs);
      return json({ logs });
    }

    if (method === "DELETE" && path.includes("logs")) {
      const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
      const logId = body?.logId != null ? String(body.logId) : null;
      if (logId == null) return json({ error: "logId required" }, 400);
      const res = await getRoomItem(roomCode);
      const logs = (res.Item?.logs ?? []).filter((e) => String(e.id) !== logId);
      await putRoomItem(roomCode, logs);
      return json({ logs });
    }

    return json({ error: "Not found" }, 404);
  } catch (err) {
    console.error(err);
    return json({ error: err.message || "Server error" }, 500);
  }
};
