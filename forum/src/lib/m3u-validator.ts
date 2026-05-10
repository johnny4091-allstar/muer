export interface ValidationResult {
  valid: boolean;
  channelCount: number;
  errors: string[];
}

export async function validateM3U(urlOrContent: string, isContent = false): Promise<ValidationResult> {
  const errors: string[] = [];
  let content = "";

  if (isContent) {
    content = urlOrContent;
  } else {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(urlOrContent, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) {
        return { valid: false, channelCount: 0, errors: [`HTTP ${res.status}: Could not fetch playlist`] };
      }
      content = await res.text();
    } catch (e) {
      return { valid: false, channelCount: 0, errors: ["Could not reach playlist URL"] };
    }
  }

  if (!content.trim().startsWith("#EXTM3U")) {
    return { valid: false, channelCount: 0, errors: ["Not a valid M3U playlist (missing #EXTM3U header)"] };
  }

  const lines = content.split("\n").map((l) => l.trim());
  let channelCount = 0;
  const streamUrls: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("#EXTINF:")) {
      channelCount++;
      const nextLine = lines[i + 1];
      if (nextLine && (nextLine.startsWith("http://") || nextLine.startsWith("https://"))) {
        if (streamUrls.length < 5) streamUrls.push(nextLine);
      }
    }
  }

  if (channelCount === 0) {
    errors.push("No channels found in playlist");
    return { valid: false, channelCount: 0, errors };
  }

  return {
    valid: errors.length === 0,
    channelCount,
    errors,
  };
}
