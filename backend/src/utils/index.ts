import { Static } from "elysia";
import { contentType } from "../types";

export function parseJsonContentToString(content: Static<typeof contentType>): string {
  if (content.text) {
    return content.text || "";
  } else if (content.content && Array.isArray(content.content)) {
    return content.content
      .map((item) => parseJsonContentToString(item))
      .join("");
  } else {
    return "";
  }
}
