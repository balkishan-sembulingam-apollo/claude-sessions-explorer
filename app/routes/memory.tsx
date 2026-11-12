import { useParams } from "react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/contexts/app-store";

export default function Memory() {
  const { projects } = useAppStore();
  const { projectKey, memoryFile } = useParams();
  const project = projects.find((p) => p.key === projectKey);
  const memory = project?.memoryFiles.find((m) => m.fileName === memoryFile);

  if (!memory) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        Memory file not found.
      </div>
    );
  }

  return (
    <div className="mx-auto h-full w-full max-w-3xl overflow-auto p-8">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-semibold">{memory.name}</h1>
        {typeof memory.frontmatter.metadata === "object" &&
          memory.frontmatter.metadata !== null &&
          Object.entries(
            memory.frontmatter.metadata as Record<string, unknown>,
          ).map(([key, value]) => (
            <Badge key={key} variant="outline" className="text-[10px]">
              {key}: {String(value)}
            </Badge>
          ))}
      </div>
      {typeof memory.frontmatter.description === "string" && (
        <p className="mb-6 text-sm text-muted-foreground">
          {memory.frontmatter.description}
        </p>
      )}
      <article className="prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{memory.body}</ReactMarkdown>
      </article>
    </div>
  );
}
