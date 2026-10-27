import "./eco-chef";
import "./styles/eco-chef.styles";
import { registerServiceWorker } from "./services/sw.service";
import { initInsights } from "./services/insights.service";

registerServiceWorker();
initInsights();
