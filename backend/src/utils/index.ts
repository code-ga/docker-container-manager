import { Static } from "elysia";
import { contentType } from "../types";
import { db } from "../database";
import { table } from "../database/schema";
import { eq, and } from "drizzle-orm";

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

/**
 * Check if user has assignment to container (shared utility function)
 * @param userId - The user ID to check
 * @param containerId - The container ID to check
 * @returns Promise<boolean> - True if user has assignment, false otherwise
 */
export async function checkContainerAssignment(
  userId: string,
  containerId: string
): Promise<boolean> {
  try {
    const assignment = await db
      .select()
      .from(table.userContainerAssignments)
      .where(
        and(
          eq(table.userContainerAssignments.userId, userId),
          eq(table.userContainerAssignments.containerId, containerId)
        )
      )
      .limit(1);

    return assignment.length > 0;
  } catch (error) {
    console.error("Error checking container assignment:", error);
    return false;
  }
}
