import { Window } from "@/components/Window";
import { profile } from "@/data/profile";
import { defineApp } from "../define";

export type Photo = { src: string; taken: Date; settings?: string; verdict?: string };

function PhotoView({ payload: photo }: { payload: Photo | undefined }) {
	if (!photo) return null;
	const when = photo.taken.toLocaleString("en-US", { timeZone: profile.timezone, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
	const stamp = photo.taken.toLocaleString("sv-SE", { timeZone: profile.timezone }).slice(0, 16).replace(/[-: ]/g, "");
	return (
		<Window>
			<div className="p-3">
				{/* Smooth scaling: shrinking a dither with hard pixels keeps only one phase of it and washes the photo out. */}
				<img src={photo.src} alt="The desktop wallpaper: dithered Ozark hills" className="block w-full border-2 border-black" />
				<div className="mt-2 flex items-center justify-between gap-3 text-xs">
					<span>
						Rogers, AR · {when}
						<br />
						{photo.settings ?? "f/8 · 1/250 · ISO 100"}
						{photo.verdict && (
							<>
								<br />
								<span className="font-ui">{photo.verdict}</span>
							</>
						)}
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
	// Opens to the right of the Camera so the two sit side by side.
	window: { x: 752, y: 90, width: 340 },
	component: PhotoView,
});
