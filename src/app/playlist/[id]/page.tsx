import { getPlaylistDetails } from "@/lib/youtube";
import { PlaylistClientView } from "./PlaylistClientView";

export default async function PlaylistPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const resolvedParams = await params;
    const playlist = await getPlaylistDetails(resolvedParams.id);

    return <PlaylistClientView playlist={playlist} />;
}
