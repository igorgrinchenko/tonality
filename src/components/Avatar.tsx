import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";
import useStyles from "../styles/styles";

const UserAvatar: React.FC = () => {
    const { userAvatar } = useStyles();

    return (
        <Stack direction="row" spacing={2}>
            <Avatar className={userAvatar} alt="avatar" src="" />
        </Stack>
    );
};

export default UserAvatar;
