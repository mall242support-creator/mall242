import { Helmet } from 'react-helmet-async';

export const SafeHelmet = ({ title, children, ...props }) => {
  const safeTitle = title && title.trim() ? title : 'Mall242';
  
  return (
    <Helmet {...props}>
      <title>{safeTitle}</title>
      {children}
    </Helmet>
  );
};