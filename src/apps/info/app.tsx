import type { IconName } from "@/components/icons";
import { PixelIcon } from "@/components/icons";
import { Logo } from "@/components/Logo";
import { Window } from "@/components/Window";
import { defineApp, type InfoRow } from "../define";

export type Info = { icon: IconName | "logo"; label: string; rows: InfoRow[] };

function GetInfo({ payload: info }: { payload: Info | undefined }) {
	if (!info) return null;
	return (
		<Window title={`${info.label} Info`}>
			<div className="p-5">
				<div className="flex items-center gap-3 border-b-2 border-black pb-3">
					{info.icon === "logo" ? <Logo size={36} /> : <PixelIcon name={info.icon} size={40} />}
					<h3 className="font-ui text-lg">{info.label}</h3>
				</div>
				<dl className="mt-3 space-y-1 text-sm">
					{info.rows.map(([k, v]) => (
						<div key={k} className="flex gap-3">
							<dt className="w-28 shrink-0 text-right">{k}:</dt>
							<dd>{v}</dd>
						</div>
					))}
				</dl>
			</div>
		</Window>
	);
}

/** Get Info: Alt + double-click any desktop icon. */
export default defineApp<Info>({
	id: "info",
	title: "Info",
	icon: "doc",
	place: "hidden",
	window: { x: 460, y: 200, width: 300 },
	component: GetInfo,
});
