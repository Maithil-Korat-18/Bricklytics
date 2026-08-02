import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import ContentContainer from '../../components/common/ContentContainer';
import PlaceholderCard from '../../components/common/PlaceholderCard';

export default function SettingsPage() {
  return (
    <ContentContainer>
      <PageHeader 
        title="Seller Settings"
        description="Configure account preferences, notification alerts, and API integration keys."
      />
      <PlaceholderCard 
        title="Account & Platform Settings"
        subtitle="Manage seller profile details, notification preferences, security options, and custom API settings."
        featureList={[
          'Seller profile & contact details management',
          'Notification frequency & email alert settings',
          'Security, password updates, and active sessions'
        ]}
      />
    </ContentContainer>
  );
}
