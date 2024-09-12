"use client"

import { useAuth } from '@/context/AuthContext';
import withAuth from '@/hoc/withAuth';
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from 'react';
import ExpandedDashboard from "./ExpandedDashboard";
import Roadmap from "./Roadmap";
import { useTheme } from 'next-themes';
import AddBoardDialog from '@/components/board/AddBoard';
import OnboardingWorkflow from '@/components/OnboardingWorkflow';


const Dashboard: React.FC = ({ params }) => {
  const { logout } = useAuth();
  const router = useRouter();
  const { theme } = useTheme()

  const [boards, setBoards] = useState([])
  const [isLoading, setLoading] = useState(true)
  const [publicRoadmapUrl, setPublicRoadmapUrl] = useState('')
  const [publicRoadmapEnabled, setPublicRoadmapEnabled] = useState(true)
  const [org, setOrg] = useState(null)
  const [triggerOnboarding, setTriggerOnboarding] = useState(false)


  useEffect(() => {
    if (!params.slug) {
      return;
    }
    fetch('/api/auth/boards/fetch-boards', {
      headers: {
        "x-org-slug": params.slug,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        // set boards as an array of objects with name and value properties
        // e.g. { name: "Board 1", value: 10 }
        if (!data || data.length < 1) {
          setTriggerOnboarding(true)
          return;
        }
        const boardList = data.map((board) => ({
          name: board.name,
          value: board.id
        }));
        setBoards([
          { name: 'All Boards', value: 'ALL' }, ...boardList])
      })
  }, [params.slug])



  useEffect(() => {
    fetch(`/api/auth/pages/fetch-org`, {
      headers: {
        "x-org-slug": params.slug
      }
    })
      .then((res) => res.json())
      .then((data) => {
        setOrg(data)
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
        setPublicRoadmapUrl(url)
      })

  }, [params.id, params.slug, theme])


  if (triggerOnboarding) {
    return (
      <OnboardingWorkflow params={params} />
    )
  }
  return (
    <div className="p-4 space-y-8">
      <h1 className="text-3xl font-bold">Dashboard - {org && org.name}</h1>
      {
        (!boards || boards.length < 1) ? null :
          <ExpandedDashboard params={params} boards={boards} />
      }
      {publicRoadmapEnabled && <Roadmap params={params} publicRoadmapUrl={publicRoadmapUrl} />}
    </div>
  );
}
export default withAuth(Dashboard);

