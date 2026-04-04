import { prisma as defaultPrisma } from "./prisma.js";
import {
  classifyComplaintImage as defaultClassifyComplaintImage,
  verifyBeforeAfter as defaultVerifyBeforeAfter
} from "../services/ai.service.js";

const defaultDeps = {
  prisma: defaultPrisma,
  classifyComplaintImage: defaultClassifyComplaintImage,
  verifyBeforeAfter: defaultVerifyBeforeAfter
};

const runtimeDeps = {
  ...defaultDeps
};

export function getRuntimeDeps() {
  return runtimeDeps;
}

export function __setRuntimeDepsForTests(overrides = {}) {
  Object.assign(runtimeDeps, overrides);
}

export function __resetRuntimeDepsForTests() {
  Object.assign(runtimeDeps, defaultDeps);
}
