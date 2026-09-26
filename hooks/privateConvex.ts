"use client";
import { useQuery as useBaseQuery, useMutation as useBaseMutation } from "convex/react";
import { getFunctionName, FunctionReference, FunctionArgs } from "convex/server";
import { useEffect, useState, useCallback } from "react";
export * from "convex/react";

export function storedToken() {
  return typeof window === "undefined" ? "" : localStorage.getItem("admin_token") || localStorage.getItem("reader_token") || "";
}
function isPrivate(ref: FunctionReference<"query" | "mutation">) {
  const name = getFunctionName(ref);
  return !name.startsWith("admin:") && !name.startsWith("writerAuth:") && !["invitations:session", "invitations:accept", "invitations:logout"].includes(name);
}
export const useQuery: typeof useBaseQuery = (ref, ...rest) => {
  const [token, setToken] = useState("");
  useEffect(() => { setToken(storedToken()); }, []);
  const args = rest[0];
  return useBaseQuery(ref, (args === "skip" || (isPrivate(ref as FunctionReference<"query">) && !token) ? "skip" : isPrivate(ref as FunctionReference<"query">) ? { ...args, accessToken: token } : args ?? {}) as never);
};
export function useMutation<M extends FunctionReference<"mutation">>(ref: M) {
  const mutate = useBaseMutation(ref);
  return useCallback((args: FunctionArgs<M>) => mutate((isPrivate(ref) ? { ...args, accessToken: storedToken() } : args) as FunctionArgs<M>), [mutate, ref]);
}
