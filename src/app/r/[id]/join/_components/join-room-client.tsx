"use client";

import { DisplayNameForm } from "./display-name-form";

interface Props {
  roomId: string;
}

export const JoinRoomClient = ({ roomId }: Props) => {
  return <DisplayNameForm roomId={roomId} />;
};
