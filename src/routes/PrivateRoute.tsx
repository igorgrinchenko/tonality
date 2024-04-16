import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { isSignedIn } from "../redux/store";
import { authPath } from "./routes";
import { PrivateRouteProps } from "../common/interfaces";

const PrivateRoute: React.FC<PrivateRouteProps> = ({ routeElement }: PrivateRouteProps) => {
    const _isSignedIn: boolean = useSelector(isSignedIn);

    return _isSignedIn ? routeElement : <Navigate to={authPath} />;
};

export default PrivateRoute;
