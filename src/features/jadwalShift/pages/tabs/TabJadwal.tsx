import TabelMatrixJadwal from "../../../../features/jadwalShift/components/TabelMatrixJadwal";
import { useMatrixJadwal } from "../../hooks/useMatrixJadwal";

interface TabJadwalProps {
    hookParams: ReturnType<typeof useMatrixJadwal>;
}

export default function TabJadwal({ hookParams }: TabJadwalProps) {
    return (
        <TabelMatrixJadwal hookParams={hookParams} />
    );
}
