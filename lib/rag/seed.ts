import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";
import { ingestDocument } from "./embeddings";

const dbPath =
  process.env.DATABASE_URL?.replace("file:", "").replace("file://", "") ??
  "./prisma/dev.db";

const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

interface DocEntry {
  sourceFile: string;
  content: string;
}

const documents: DocEntry[] = [
  {
    sourceFile: "illinois-probate-basics.md",
    content: `# Illinois Probate Overview

Probate is the court-supervised process of distributing a deceased person's estate. In Illinois, probate is handled by the Circuit Court in the county where the deceased lived.

Not every estate requires full probate. Illinois offers a Small Estate Affidavit process for estates valued at $100,000 or less in personal property (excluding real estate). This allows heirs to collect assets without opening a formal probate case by filing a Small Estate Affidavit at least 30 days after the death.

# Opening a Probate Case in Illinois

To open probate in Illinois, you must file a petition with the Circuit Court clerk in the county where the deceased resided. You will need the original death certificate, the original will (if one exists), and a filing fee that varies by county but is typically between $250 and $350.

The court will appoint a representative for the estate. If there is a will, the person named as executor files a petition for Letters Testamentary. If there is no will, a family member can petition for Letters of Administration. The representative must post a bond unless the will waives this requirement.

Illinois probate typically takes 6 to 12 months. During this time, the representative must inventory all assets, notify creditors by publication in a local newspaper, pay valid debts and taxes, and distribute the remaining assets to beneficiaries.

# Illinois Probate Deadlines

The will should be filed with the county clerk within 30 days of death, even if you do not plan to open probate immediately. Creditors have 6 months from the date of the first publication of the death notice to file claims against the estate. The estate's representative must file an inventory of assets within 60 days of appointment.

# Independent Administration in Illinois

Illinois allows Independent Administration, which reduces court oversight and simplifies the process. The representative can sell property, pay claims, and distribute assets without getting court approval for each action. To use this, the petition must request independent administration, and no interested party can object. Most Illinois estates use independent administration.

# Illinois Estate Tax

Illinois has a state estate tax for estates exceeding $4 million in value. The Illinois estate tax return (Form 700) must be filed within 9 months of death. The federal estate tax exemption is much higher (approximately $13.6 million for 2024), so most estates owe Illinois estate tax but not federal estate tax.`,
  },
  {
    sourceFile: "social-security-death-notification.md",
    content: `# Notifying Social Security of a Death

The Social Security Administration (SSA) must be notified as soon as possible after a death. In most cases, the funeral home will report the death to SSA using the deceased's Social Security number. However, you should confirm with the funeral home that they have done so.

If the funeral home has not reported the death, you must contact SSA directly by calling 1-800-772-1213 (TTY 1-800-325-0778). SSA does not accept death notifications online. You will need the deceased's Social Security number, date of birth, and date of death.

# Social Security Benefit Payments After Death

Any Social Security benefits paid for the month of death or later must be returned. Social Security benefits are paid the month after they are due — so a payment received in the month after death is actually for the month of death and must be returned. If the payment was by direct deposit, contact the bank to return the funds to SSA.

A surviving spouse may be eligible for a one-time lump-sum death payment of $255. To qualify, the surviving spouse must have been living with the deceased at the time of death, or was receiving benefits on the deceased's record. This payment must be applied for within 2 years of the death.

# Survivor Benefits

Surviving spouses age 60 or older (or age 50 if disabled) may be eligible for survivor benefits based on the deceased's earnings record. Surviving spouses caring for the deceased's child under age 16 may also qualify regardless of age. Unmarried children under 18 (or up to 19 if still in high school) may receive benefits.

Survivor benefits can be up to 100% of the deceased's benefit amount if claimed at the survivor's full retirement age. Claiming before full retirement age reduces the benefit. If the surviving spouse is already receiving their own Social Security retirement benefit, they can switch to survivor benefits if the amount is higher.

To apply for survivor benefits, call SSA at 1-800-772-1213 or visit your local Social Security office. You will need the death certificate, your Social Security number, the deceased's Social Security number, your birth certificate, and your marriage certificate.`,
  },
  {
    sourceFile: "bank-account-closure-process.md",
    content: `# Closing a Deceased Person's Bank Accounts

When someone dies, their bank accounts are not automatically closed. The process for closing accounts depends on how the accounts are titled and whether the estate goes through probate.

# Joint Accounts

If the deceased had a joint bank account with right of survivorship, the surviving account holder retains full access to the account. The bank will remove the deceased's name from the account upon receiving a certified copy of the death certificate. No probate is needed for joint accounts.

# Individual Accounts

Individual accounts in the deceased's name alone are frozen once the bank is notified of the death. To access these funds, you will need to provide the bank with a certified copy of the death certificate and either Letters Testamentary or Letters of Administration from the probate court. If the estate qualifies for small estate procedures, a Small Estate Affidavit may suffice.

# Payable-on-Death (POD) Accounts

If the account has a payable-on-death (POD) or transfer-on-death (TOD) beneficiary designation, the named beneficiary can claim the funds by presenting a certified death certificate and valid government-issued ID at the bank. No probate is needed for POD/TOD accounts.

# Steps to Close Accounts

1. Gather documents: certified death certificates (order at least 10 copies — many institutions require them), Letters Testamentary or Letters of Administration, and your government-issued photo ID.
2. Visit each bank in person with the documents. Call ahead to confirm what they require.
3. Ask about any automatic payments or direct deposits linked to the account. Redirect recurring deposits (pension, Social Security) and cancel automatic payments (utilities, subscriptions).
4. Request a final statement showing all transactions up to the closure date.
5. If the account has outstanding checks, ask the bank about their policy on honoring them after the account holder's death.
6. Transfer remaining funds to the estate account or to the appropriate beneficiaries.

# Important Considerations

Do not withdraw funds from an individual account before proper legal authority is established. Doing so could create legal liability. Open a dedicated estate checking account to manage the deceased's financial affairs during probate. Keep detailed records of all transactions for the final accounting.`,
  },
  {
    sourceFile: "life-insurance-claims.md",
    content: `# Filing a Life Insurance Claim

Life insurance proceeds are generally paid directly to named beneficiaries and do not go through probate. Benefits are typically income-tax-free to the beneficiary, though they may be included in the estate for estate tax purposes.

# Locating Life Insurance Policies

Check the deceased's files, safe deposit box, email, and mail for policy documents or premium payment notices. Contact the deceased's employer — many employers provide group life insurance as a benefit. Check with the deceased's financial advisor, attorney, or accountant. Search the National Association of Insurance Commissioners (NAIC) Life Insurance Policy Locator at https://eapps.naic.org/life-policy-locator/ — this free service checks participating insurers' records.

Review bank and credit card statements for premium payments to insurance companies. In Illinois, you can also contact the Illinois Department of Insurance at 1-866-445-5364 to ask about policies registered in the state.

# Filing the Claim

Contact the insurance company's claims department. They will send you a claim form (or you can download it from their website). You will typically need: a completed claim form, a certified copy of the death certificate, the policy number, and the claimant's identification and tax ID/Social Security number.

Most insurers process claims within 30 to 60 days of receiving complete paperwork. If the death occurred within the first two years of the policy (the contestability period), the insurer may investigate before paying the claim. If the cause of death is excluded by the policy (such as suicide within the first two years), the insurer may deny the claim but is typically required to refund premiums paid.

# Payment Options

Beneficiaries can usually choose how to receive proceeds: a lump-sum payment, an annuity (structured payments over time), or retained by the insurer in an interest-bearing account. Consider consulting a financial advisor before choosing, especially for large benefit amounts.

# Multiple Beneficiaries and Disputes

If the policy names multiple beneficiaries, each files their own claim for their designated share. If the named beneficiary has predeceased the insured and no contingent beneficiary is named, the proceeds go to the insured's estate and will be subject to probate. Disputes over beneficiary designations may require legal resolution.`,
  },
  {
    sourceFile: "irs-final-tax-return.md",
    content: `# Filing the Final Federal Tax Return

A final federal income tax return (Form 1040) must be filed for the year in which the deceased passed away. This return covers income from January 1 through the date of death. The filing deadline is the normal April 15 of the following year, unless an extension is requested.

# Who Files the Return

If the deceased was married, the surviving spouse can file a joint return for the year of death. This is often advantageous because joint filing typically results in lower taxes. The surviving spouse signs the return and writes "Filing as surviving spouse" in the signature area. If the deceased was unmarried, the executor or personal representative files the return on behalf of the deceased, signing as "personal representative."

If no executor has been appointed, whoever is responsible for the deceased's property should file the return. They must attach Form 1310, Statement of Person Claiming Refund Due a Deceased Taxpayer, if a refund is owed.

# Income to Report

Report all income the deceased received from January 1 through the date of death: wages, salary, interest, dividends, retirement distributions, rental income, and any other taxable income. Income received after the date of death belongs to the estate and is reported on the estate's income tax return (Form 1041), not the final 1040.

Request a wage and income transcript from the IRS if you are unsure about all income sources. This can be done online at irs.gov, by calling 1-800-908-9946, or by filing Form 4506-T.

# Deductions and Credits

The final return can claim the standard deduction or itemized deductions. Medical expenses paid before death can be deducted. Medical expenses paid by the estate within one year of death can be claimed on the final 1040 if an election is made (rather than on the estate return). Charitable contributions made before death are deductible on the final return.

# Estate Income Tax Return (Form 1041)

If the estate earns more than $600 in income after the date of death (from interest, dividends, rent, asset sales, etc.), the executor must also file Form 1041, the estate income tax return. The estate will need its own Employer Identification Number (EIN), which can be obtained online at irs.gov or by calling 1-800-829-4933. Form 1041 is due on April 15 of the year following the tax year, unless the estate elects a fiscal year.

# Illinois State Tax Return

Illinois requires a final state income tax return (Form IL-1040) for the year of death. Illinois has a flat income tax rate of 4.95%. The filing deadline matches the federal deadline. If a federal extension is filed, Illinois automatically grants an extension.`,
  },
  {
    sourceFile: "dmv-notification-process.md",
    content: `# Notifying the DMV After a Death

The deceased's driver's license should be returned to the state's Department of Motor Vehicles (DMV) or Secretary of State's office. In Illinois, this is handled by the Illinois Secretary of State's office.

# Illinois Secretary of State Notification

To cancel a deceased person's Illinois driver's license, mail or bring to any Secretary of State facility: a copy of the death certificate and the deceased's driver's license or state ID card (if available). You can also write a letter requesting cancellation that includes the deceased's full legal name, date of birth, driver's license number, and date of death.

Mail documents to: Illinois Secretary of State, Driver Services Department, 2701 S. Dirksen Parkway, Springfield, IL 62723.

Canceling the license helps prevent identity theft. The deceased's identity can be used fraudulently for years if the license remains active in the system.

# Vehicle Title Transfer

If the deceased owned a vehicle, the title must be transferred to the heir or estate. In Illinois, you will need the current vehicle title, a certified copy of the death certificate, and proof of your legal authority (Letters Testamentary, Letters of Administration, or Small Estate Affidavit).

If the vehicle title is held jointly with right of survivorship, the surviving owner can transfer the title by presenting the death certificate and current title at a Secretary of State facility. If the vehicle was titled solely in the deceased's name, the estate representative must transfer the title through probate.

# Canceling Vehicle Registration and Insurance

Cancel or transfer the vehicle registration to avoid ongoing fees. Contact the deceased's auto insurance company to cancel the policy or transfer coverage. If the vehicle will not be driven, you can request a non-use or storage status from the insurer. Any unused premium is typically refunded to the estate.

# Parking Placards and Disability Plates

If the deceased had a disability parking placard or plates, these should be returned to the Secretary of State's office. Disability placards are non-transferable and using a deceased person's placard is a violation.`,
  },
  {
    sourceFile: "general-post-death-checklist.md",
    content: `# Immediate Steps After a Death (First 48 Hours)

These tasks should be handled right away:

Obtain a legal pronouncement of death. If the person died at home under hospice care, the hospice nurse can pronounce death. Otherwise, call 911 and paramedics or a physician will make the pronouncement.

Contact a funeral home. The funeral home will arrange transportation of the body, help you obtain the death certificate, and can report the death to Social Security. Choose burial or cremation — if the deceased left instructions or pre-paid arrangements, follow those.

Order at least 10 to 15 certified copies of the death certificate from the funeral home or county vital records office. Many institutions require certified originals (not photocopies). In Illinois, certified copies cost approximately $15 to $20 each from the county clerk.

Secure the deceased's home and property. Lock the residence, collect mail, and arrange care for any pets. If the home will be unoccupied, notify the homeowner's insurance company to maintain coverage.

# First Week Tasks

Notify the deceased's employer and ask about final paychecks, benefits continuation (COBRA), life insurance through work, and retirement account beneficiary procedures.

Contact an attorney if the estate is complex (property in multiple states, business interests, potential disputes among heirs, or estate value may trigger estate tax). In Illinois, consult an attorney if the estate exceeds the $100,000 small estate threshold.

Begin gathering financial documents: recent tax returns, bank statements, investment account statements, mortgage documents, insurance policies, vehicle titles, and property deeds.

Notify the three major credit bureaus (Equifax, Experian, TransUnion) to place a deceased alert on the credit report. This helps prevent identity theft.

# First Month Tasks

File for life insurance benefits — contact each insurer with a claim form and certified death certificate.

Notify Social Security and apply for survivor benefits if eligible. Return any benefit payments received for the month of death or after.

Contact the deceased's bank(s) and financial institutions. Determine account types (joint, individual, POD) and take appropriate steps for each.

Review and cancel or transfer subscriptions, memberships, and recurring payments. Cancel credit cards in the deceased's name alone (joint cards remain active for the surviving cardholder).

Change or redirect mail through the USPS. File a change of address form to forward the deceased's mail to the executor or surviving family member.

Contact utility companies to transfer or cancel service. Keep utilities active if the home will be maintained or sold.

# Within 3 to 6 Months

Open probate if required. File the will with the county clerk within 30 days of death in Illinois.

Apply for an EIN for the estate if the estate will earn income or if probate is opened.

File final income tax returns (federal and state) for the year of death.

Notify the Illinois Secretary of State to cancel the driver's license. Transfer vehicle titles as needed.

Review and update your own estate plan. The death of a spouse or family member often changes your own beneficiary designations, will provisions, and power of attorney documents.`,
  },
];

async function seed() {
  console.log("Seeding RAG knowledge base...\n");

  let totalChunks = 0;

  for (const doc of documents) {
    const count = await ingestDocument(prisma, doc.sourceFile, doc.content);
    console.log(`  ${doc.sourceFile}: ${count} chunks`);
    totalChunks += count;
  }

  console.log(`\nDone. ${totalChunks} total chunks ingested across ${documents.length} documents.`);
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
