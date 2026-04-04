function cloneRecord(record) {
  return {
    ...record
  };
}

function applyWhere(records, where = {}) {
  const keys = Object.keys(where || {});
  if (keys.length === 0) return records;

  return records.filter((record) =>
    keys.every((key) => record[key] === where[key])
  );
}

function applySelect(record, select) {
  if (!record) return null;
  if (!select) return cloneRecord(record);

  const selected = {};
  for (const [key, isEnabled] of Object.entries(select)) {
    if (isEnabled) {
      selected[key] = record[key];
    }
  }
  return selected;
}

function sortByCreatedAtDesc(items) {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function createInMemoryPrisma() {
  const store = {
    complaints: [],
    verifications: [],
    auditLogs: []
  };

  let counter = 0;
  const nextId = (prefix) => `${prefix}_${++counter}`;

  function readVerification(complaintId, includeConfig) {
    const verification = store.verifications.find(
      (item) => item.complaintId === complaintId
    );
    if (!verification) return null;

    if (includeConfig?.select) {
      return applySelect(verification, includeConfig.select);
    }

    return cloneRecord(verification);
  }

  function readAuditLogs(complaintId, includeConfig) {
    const logs = store.auditLogs.filter((item) => item.complaintId === complaintId);
    const ordered =
      includeConfig?.orderBy?.createdAt === "desc"
        ? sortByCreatedAtDesc(logs)
        : [...logs];
    return ordered.map(cloneRecord);
  }

  function includeRelations(record, include) {
    if (!record || !include) return cloneRecord(record);

    const nextRecord = cloneRecord(record);

    if (include.verification) {
      nextRecord.verification = readVerification(record.id, include.verification);
    }

    if (include.auditLogs) {
      nextRecord.auditLogs = readAuditLogs(record.id, include.auditLogs);
    }

    return nextRecord;
  }

  const complaintApi = {
    async create({ data }) {
      const now = new Date();
      const complaint = {
        id: data.id || nextId("cmp"),
        title: data.title || null,
        description: data.description || null,
        locationText: data.locationText,
        latitude:
          typeof data.latitude === "number" ? data.latitude : data.latitude ?? null,
        longitude:
          typeof data.longitude === "number" ? data.longitude : data.longitude ?? null,
        imageUrl: data.imageUrl,
        imagePublicId: data.imagePublicId || null,
        imageMimeType: data.imageMimeType || null,
        issueType: data.issueType || "UNKNOWN",
        severity: data.severity || "MEDIUM",
        status: data.status || "PENDING",
        department: data.department || null,
        aiSummary: data.aiSummary || null,
        aiConfidence:
          typeof data.aiConfidence === "number" ? data.aiConfidence : data.aiConfidence ?? null,
        aiRawJson: data.aiRawJson || null,
        reportedByName: data.reportedByName || null,
        reportedByEmail: data.reportedByEmail || null,
        createdAt: now,
        updatedAt: now
      };

      store.complaints.push(complaint);
      return cloneRecord(complaint);
    },

    async findMany({ where = {}, orderBy, skip = 0, take, include } = {}) {
      const filtered = applyWhere(store.complaints, where);
      const ordered =
        orderBy?.createdAt === "desc" ? sortByCreatedAtDesc(filtered) : [...filtered];
      const start = Number.isFinite(skip) ? skip : 0;
      const end = Number.isFinite(take) ? start + take : undefined;
      const sliced = ordered.slice(start, end);
      return sliced.map((record) => includeRelations(record, include));
    },

    async count({ where = {} } = {}) {
      return applyWhere(store.complaints, where).length;
    },

    async findUnique({ where, select, include } = {}) {
      const record = store.complaints.find((item) => item.id === where?.id);
      if (!record) return null;

      if (include) {
        return includeRelations(record, include);
      }

      return applySelect(record, select);
    },

    async update({ where, data }) {
      const index = store.complaints.findIndex((item) => item.id === where?.id);
      if (index === -1) {
        throw new Error("Complaint not found");
      }

      const current = store.complaints[index];
      const updated = {
        ...current,
        ...data,
        updatedAt: new Date()
      };

      store.complaints[index] = updated;
      return cloneRecord(updated);
    }
  };

  const complaintAuditLogApi = {
    async create({ data }) {
      const log = {
        id: data.id || nextId("audit"),
        complaintId: data.complaintId,
        action: data.action,
        oldValue: data.oldValue || null,
        newValue: data.newValue || null,
        createdAt: new Date()
      };
      store.auditLogs.push(log);
      return cloneRecord(log);
    }
  };

  const complaintVerificationApi = {
    async upsert({ where, create, update }) {
      const index = store.verifications.findIndex(
        (item) => item.complaintId === where?.complaintId
      );

      if (index === -1) {
        const record = {
          id: create.id || nextId("ver"),
          complaintId: create.complaintId,
          beforeImageUrl: create.beforeImageUrl,
          afterImageUrl: create.afterImageUrl,
          afterImagePublicId: create.afterImagePublicId || null,
          afterImageMimeType: create.afterImageMimeType || null,
          verificationStatus: create.verificationStatus,
          verificationSummary: create.verificationSummary || null,
          verificationConfidence:
            typeof create.verificationConfidence === "number"
              ? create.verificationConfidence
              : create.verificationConfidence ?? null,
          aiRawJson: create.aiRawJson || null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        store.verifications.push(record);
        return cloneRecord(record);
      }

      const current = store.verifications[index];
      const next = {
        ...current,
        ...update,
        updatedAt: new Date()
      };
      store.verifications[index] = next;
      return cloneRecord(next);
    }
  };

  const tx = {
    complaint: complaintApi,
    complaintAuditLog: complaintAuditLogApi,
    complaintVerification: complaintVerificationApi
  };

  return {
    prisma: {
      complaint: complaintApi,
      complaintAuditLog: complaintAuditLogApi,
      complaintVerification: complaintVerificationApi,
      async $transaction(input) {
        if (typeof input === "function") {
          return input(tx);
        }

        if (Array.isArray(input)) {
          return Promise.all(input);
        }

        throw new Error("Unsupported transaction input");
      }
    },
    store
  };
}
