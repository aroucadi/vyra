import { permanentRedirect } from "next/navigation";

/**
 * Legacy route forwarder: gracefully routes all /library bookmarks, PWA home screens,
 * and old URLs directly to the canonical /exercises catalogue page.
 */
export default function LibraryPage() {
  permanentRedirect("/exercises");
}
