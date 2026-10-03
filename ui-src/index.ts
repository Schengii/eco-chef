import { inject } from '@vercel/analytics';
import "./eco-chef";
import "./styles/eco-chef.styles";

// Initialize Vercel Web Analytics
inject({
  mode: 'production',
});