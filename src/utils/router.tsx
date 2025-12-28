import React from "react";
import { type RouteObject } from "react-router-dom";
import * as Pages from "@/pages";

const router: RouteObject[] = [
  {
    path: "/",
    element: <Pages.Home />,
  },
  {
    path: "/admin",
    element: <Pages.Admin />,
  },
  {
    path: "/admin/permission",
    element: <Pages.AdminPermission />,
  },
  {
    path: "/admin/meet",
    element: <Pages.MeetVote />,
  },
  {
    path: "/admin/vote",
    element: <Pages.TravelVote />,
  },
  {
    path: "/admin/notification",
    element: <Pages.NotificationCreate />,
  },
  {
    path: "/auth/login",
    element: <Pages.Login />,
  },
  {
    path: "/auth/kakao/redirect",
    element: <Pages.KakaoCode />,
  },
  {
    path: "/Unauthorized",
    element: <Pages.Unauthorized />,
  },
  {
    path: "/post/list",
    element: <Pages.PostList />,
  },
  {
    path: "/not-found",
    element: <Pages.NotFound />,
  },
  {
    path: "meet/edit/:meetId",
    element: <Pages.MeetEdit />,
  },
  {
    path: "/meet/vote/:meetId",
    element: <Pages.VotePage />,
  },
  {
    path: "/post/:postId",
    element: <Pages.PostDetail />,
  },
  {
    path: "/meet/join/:meetId",
    element: <Pages.JoinVotePage />,
  },
  {
    path: "/meet/create",
    element: <Pages.MeetCreate />
  }
];

export default router;
