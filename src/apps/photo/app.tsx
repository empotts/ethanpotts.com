import { Window } from "@/components/Window";
import { profile } from "@/data/profile";
import { defineApp } from "../define";

export type Photo = { src: string; taken: Date };

function PhotoView({ payload: photo }: { payload: Photo | undefined }) {
	if (!photo) return null;
	const when = photo.taken.toLocaleString("en-US", { timeZone: profile.timezone, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
	const stamp = photo.taken.toLocaleString("sv-SE", { timeZone: profile.timezone }).slice(0, 16).replace(/[-: ]/g, "");
	return (
		<Window>
			<div className="p-3">
				<img src={photo.src} alt="The desktop wallpaper: dithered Ozark hills" className="block w-full border-2 border-black" style={{ imageRendering: "pixelated" }} />
				<div className="mt-2 flex items-center justify-between gap-3 text-xs">
					<span>
						Rogers, AR · {when}
						<br />
						f/8 · 1/250 · ISO 100
					</span>
					<a href={photo.src} download={`ozarks-${stamp}.png`} className="btn">
						Save
					</a>
				</div>
			</div>
		</Window>
	);
}

/** The Camera's last shot of the wallpaper. */
export default defineApp<Photo>({
	id: "photo",
	title: "Photo",
	icon: "camera",
	place: "hidden",
	window: { x: 300, y: 120, width: 400, resizable: true },
	component: PhotoView,
});
