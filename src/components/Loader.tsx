import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import useStyles from "../styles/styles";

const Loader: React.FC = () => {
    const [scale, setScale] = useState<number>(1);

    const inlineStyles = {
        transition: "all 1.5s ease",
        transform: `scale(${scale})`,
    };

    useEffect(() => {
        setScale(1.5);
        const interval = setInterval(() => {
            setScale((prevScale: number) => (prevScale === 1 ? 1.5 : 1));
        }, 800);

        return () => clearInterval(interval);
    }, []);
    const { blur, loader } = useStyles();

    return (
        <>
            <Box className={blur}></Box>
            <AudiotrackIcon className={loader} sx={inlineStyles} />
        </>
    );
};

export default Loader;
