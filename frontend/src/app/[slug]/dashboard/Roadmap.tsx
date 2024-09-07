import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

const Roadmap = ({ params }) => {
  const [publicRoadmapUrl, setPublicUrl] = useState('')
  const [publicRoadmapEnabled, setPublicRoadmapEnabled] = useState(true)
  const { theme } = useTheme()

  useEffect(() => {
    fetch(`/api/auth/pages/fetch-org`, {
      headers: {
        "x-org-slug": params.slug
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.roadmapSettings) {
          setPublicRoadmapEnabled(data.roadmapSettings.enabled)
        }
        let url = ''
        if (data && data.customDomain) {
          // replace :8088 with empty - local testing
          //
          url = `https://${data.customDomain}`.replace(':8088', '')
        } else if (data && data.slug) {
          url = `https://${data.slug}.suggestfeature.com`;
        }
        url = `${url}?hideNavBar=true&roadmapOnly=true&isEmbedded=true&theme=${theme}`
        setPublicUrl(url)
      })

  }, [params.id, params.slug, theme])

  if (!publicRoadmapEnabled) {
    return null
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Public Roadmap</h2>
      <div className="aspect-auto w-full h-[500px]">
        <iframe
          src={`${publicRoadmapUrl}`}
          title="Product Roadmap 2024"
          className="w-full h-full border-0 rounded-md shadow-lg"
          allowFullScreen
        />
      </div>
    </div>
  );
};

export default Roadmap;
