function looksLikePrismaInvocationError(error) {
  const message = String(error?.message || "");
  return message.includes("Invalid `prisma.") && message.includes("invocation");
}

function isPrismaClientError(error) {
  return (
    typeof error?.name === "string" &&
    error.name.startsWith("PrismaClient")
  );
}

export function errorMiddleware(err, req, res, next) {
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      message: "Uploaded file is too large"
    });
  }

  if (err?.name === "MulterError") {
    return res.status(400).json({
      success: false,
      message: err.message || "Upload failed"
    });
  }

  if (isPrismaClientError(err) || looksLikePrismaInvocationError(err)) {
    if (err?.code === "P2021" || err?.code === "P2022" || looksLikePrismaInvocationError(err)) {
      return res.status(500).json({
        success: false,
        message:
          "Database schema is not ready. Run Prisma migrations and restart server."
      });
    }

    if (err?.code === "P1001") {
      return res.status(503).json({
        success: false,
        message: "Database connection failed. Please check DATABASE_URL and database status."
      });
    }

    return res.status(500).json({
      success: false,
      message: "Database request failed"
    });
  }

  const statusCode = err.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
}
