/**
 * Company Browser Component - Company/contact browser with hierarchy
 */
import React, { useState, useEffect } from 'react';

interface CompanyBrowserProps {
  companyManager: any;
  onCompanySelect?: (companyId: number) => void;
}

export const CompanyBrowser: React.FC<CompanyBrowserProps> = ({ companyManager, onCompanySelect }) => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [configurations, setConfigurations] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await companyManager.searchCompanies({ pageSize: 50 });
      setCompanies(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load companies:', error);
      setLoading(false);
    }
  };

  const handleCompanyClick = async (company: any) => {
    setSelectedCompany(company);
    onCompanySelect?.(company.id);

    try {
      const [contactsData, configurationsData] = await Promise.all([
        companyManager.getCompanyContacts(company.id),
        companyManager.client.getConfigurations(`company/id=${company.id}`)
      ]);
      setContacts(contactsData);
      setConfigurations(configurationsData);
    } catch (error) {
      console.error('Failed to load company details:', error);
    }
  };

  const filteredCompanies = companies.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.identifier?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="company-browser">
      <div className="companies-list">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="company-items">
          {filteredCompanies.map((company) => (
            <div
              key={company.id}
              className={`company-item ${selectedCompany?.id === company.id ? 'selected' : ''}`}
              onClick={() => handleCompanyClick(company)}
            >
              <div className="company-name">{company.name}</div>
              <div className="company-id">{company.identifier}</div>
            </div>
          ))}
        </div>
      </div>

      {selectedCompany && (
        <div className="company-details">
          <h3>{selectedCompany.name}</h3>
          <div className="details-section">
            <h4>Contacts ({contacts.length})</h4>
            <div className="contacts-list">
              {contacts.map((contact) => (
                <div key={contact.id} className="contact-item">
                  {contact.firstName} {contact.lastName}
                </div>
              ))}
            </div>
          </div>
          <div className="details-section">
            <h4>Configurations ({configurations.length})</h4>
            <div className="configs-list">
              {configurations.map((config) => (
                <div key={config.id} className="config-item">
                  {config.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyBrowser;
