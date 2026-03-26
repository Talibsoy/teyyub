import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    backgroundColor: "#ffffff",
    color: "#1f2937",
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
    paddingBottom: 20,
    borderBottom: "2px solid #3b82f6",
  },
  company: {
    flex: 1,
  },
  companyName: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#3b82f6",
    marginBottom: 4,
  },
  companyInfo: {
    fontSize: 9,
    color: "#6b7280",
    lineHeight: 1.5,
  },
  invoiceTitle: {
    alignItems: "flex-end",
  },
  invoiceLabel: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 11,
    color: "#3b82f6",
    fontFamily: "Helvetica-Bold",
  },
  invoiceDate: {
    fontSize: 9,
    color: "#6b7280",
    marginTop: 2,
  },
  // Sections
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: "1px solid #e5e7eb",
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: 120,
    fontSize: 9,
    color: "#6b7280",
  },
  value: {
    flex: 1,
    fontSize: 10,
    color: "#111827",
    fontFamily: "Helvetica-Bold",
  },
  // Table
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    padding: "8 10",
    borderRadius: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    padding: "8 10",
    borderBottom: "1px solid #f3f4f6",
  },
  colDescription: { flex: 3, fontSize: 10, color: "#111827" },
  colDescHeader: { flex: 3, fontSize: 9, fontFamily: "Helvetica-Bold", color: "#6b7280" },
  colQty: { flex: 1, fontSize: 10, color: "#111827", textAlign: "center" },
  colQtyHeader: { flex: 1, fontSize: 9, fontFamily: "Helvetica-Bold", color: "#6b7280", textAlign: "center" },
  colPrice: { flex: 2, fontSize: 10, color: "#111827", textAlign: "right" },
  colPriceHeader: { flex: 2, fontSize: 9, fontFamily: "Helvetica-Bold", color: "#6b7280", textAlign: "right" },
  // Total
  totalBox: {
    backgroundColor: "#eff6ff",
    padding: 16,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#1f2937",
  },
  totalAmount: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#3b82f6",
  },
  // Status
  statusBox: {
    padding: "6 12",
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  statusText: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  // Footer
  footer: {
    marginTop: "auto",
    paddingTop: 16,
    borderTop: "1px solid #e5e7eb",
    textAlign: "center",
    fontSize: 8,
    color: "#9ca3af",
  },
});

interface InvoiceData {
  booking_number: string;
  created_at: string;
  status: string;
  total_price: number;
  currency: string;
  notes: string | null;
  customer: {
    first_name: string;
    last_name: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  tour: {
    name: string;
    destination: string;
    start_date: string | null;
    end_date: string | null;
    hotel: string | null;
  } | null;
  payment_status: string;
}

const STATUS_AZ: Record<string, string> = {
  new: "Yeni",
  contacted: "Əlaqə saxlanılıb",
  confirmed: "Təsdiqlənib",
  paid: "Ödənilib",
  cancelled: "Ləğv edilib",
};

function InvoiceDocument({ data }: { data: InvoiceData }) {
  const date = new Date(data.created_at).toLocaleDateString("az-AZ", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const isPaid = data.payment_status === "paid" || data.status === "paid";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.company}>
            <Text style={styles.companyName}>Natoure.az</Text>
            <Text style={styles.companyInfo}>
              Bakı, Azərbaycan{"\n"}
              Tel: +994 51 776 96 32{"\n"}
              www.natourefly.com
            </Text>
          </View>
          <View style={styles.invoiceTitle}>
            <Text style={styles.invoiceLabel}>QAIMƏ</Text>
            <Text style={styles.invoiceNumber}>{data.booking_number}</Text>
            <Text style={styles.invoiceDate}>Tarix: {date}</Text>
          </View>
        </View>

        {/* Customer & Tour Info */}
        <View style={{ flexDirection: "row", gap: 20, marginBottom: 20 }}>
          {/* Customer */}
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Müştəri</Text>
            {data.customer ? (
              <>
                <View style={styles.row}>
                  <Text style={styles.label}>Ad Soyad:</Text>
                  <Text style={styles.value}>{data.customer.first_name} {data.customer.last_name || ""}</Text>
                </View>
                {data.customer.phone && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Telefon:</Text>
                    <Text style={styles.value}>{data.customer.phone}</Text>
                  </View>
                )}
                {data.customer.email && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Email:</Text>
                    <Text style={styles.value}>{data.customer.email}</Text>
                  </View>
                )}
              </>
            ) : (
              <Text style={{ fontSize: 10, color: "#9ca3af" }}>—</Text>
            )}
          </View>

          {/* Tour */}
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Tur Məlumatları</Text>
            {data.tour ? (
              <>
                <View style={styles.row}>
                  <Text style={styles.label}>Tur:</Text>
                  <Text style={styles.value}>{data.tour.name}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Destinasiya:</Text>
                  <Text style={styles.value}>{data.tour.destination}</Text>
                </View>
                {data.tour.hotel && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Otel:</Text>
                    <Text style={styles.value}>{data.tour.hotel}</Text>
                  </View>
                )}
                {data.tour.start_date && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Tarixlər:</Text>
                    <Text style={styles.value}>
                      {new Date(data.tour.start_date).toLocaleDateString("az-AZ")}
                      {data.tour.end_date ? ` — ${new Date(data.tour.end_date).toLocaleDateString("az-AZ")}` : ""}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <Text style={{ fontSize: 10, color: "#9ca3af" }}>—</Text>
            )}
          </View>
        </View>

        {/* Items table */}
        <View style={styles.table}>
          <Text style={styles.sectionTitle}>Xidmətlər</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.colDescHeader}>Təsvir</Text>
            <Text style={styles.colQtyHeader}>Say</Text>
            <Text style={styles.colPriceHeader}>Məbləğ</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.colDescription}>
              {data.tour ? `${data.tour.name} — ${data.tour.destination}` : "Tur xidməti"}
            </Text>
            <Text style={styles.colQty}>1</Text>
            <Text style={styles.colPrice}>{data.total_price} {data.currency}</Text>
          </View>
        </View>

        {/* Total */}
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Ümumi məbləğ:</Text>
          <Text style={styles.totalAmount}>{data.total_price} {data.currency}</Text>
        </View>

        {/* Payment status */}
        <View style={{
          ...styles.statusBox,
          backgroundColor: isPaid ? "#d1fae5" : "#fef3c7",
        }}>
          <Text style={{ ...styles.statusText, color: isPaid ? "#065f46" : "#92400e" }}>
            {isPaid ? "✓ Ödənilib" : "⏳ Ödəniş gözlənilir"}
          </Text>
        </View>

        {/* Notes */}
        {data.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Qeyd</Text>
            <Text style={{ fontSize: 10, color: "#374151" }}>{data.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Bu qaimə Natoure.az tərəfindən avtomatik yaradılmışdır.</Text>
          <Text>Sual üçün: +994 51 776 96 32 | www.natourefly.com</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  return await renderToBuffer(<InvoiceDocument data={data} />);
}
