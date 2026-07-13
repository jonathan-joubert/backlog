export interface FirearmApplication {
  id: string;
  fsref: string;
  fserial: string;
  alias: string;
}

export interface StatusResult {
  applicationType: string;
  applicationNumber: string;
  calibre: string;
  make: string;
  serialNumber: string;
  statusDate: string;
  status: string;
  statusDescription: string;
  nextStep: string;
}
