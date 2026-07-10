import type { Lagenhet } from '#/types/lagenhet'

const numberFormatter = new Intl.NumberFormat('sv-SE')

type LagenhetTableProps = {
  lagenheter: Lagenhet[]
}

export function LagenhetTable({ lagenheter }: LagenhetTableProps) {
  if (lagenheter.length === 0) {
    return <p className="text-gray-500">Inga lägenheter hittades.</p>
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-3 font-medium">Bild</th>
            <th className="px-4 py-3 font-medium">Område</th>
            <th className="px-4 py-3 font-medium">Adress</th>
            <th className="px-4 py-3 font-medium">Hyra</th>
            <th className="px-4 py-3 font-medium">Storlek</th>
            <th className="px-4 py-3 font-medium">Max poäng just nu</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {lagenheter.map((lagenhet) => (
            <tr key={lagenhet.objektNr} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <img
                  src={lagenhet.bildUrl}
                  alt={lagenhet.adress}
                  className="h-20 w-28 rounded object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </td>
              <td className="px-4 py-3 font-medium text-gray-900">{lagenhet.omrade}</td>
              <td className="px-4 py-3 text-gray-900">{lagenhet.adress}</td>
              <td className="px-4 py-3 whitespace-nowrap text-gray-900">
                {numberFormatter.format(lagenhet.hyra)} {lagenhet.hyraEnhet}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-gray-900">
                {lagenhet.yta} m²
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-gray-900">
                {numberFormatter.format(lagenhet.poang)} p
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
