import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Eye, Package, CheckCircle, XCircle, Clock, Truck, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Order, OrderItem } from "@shared/schema";
import { ChevronLeft, ChevronRight } from "lucide-react";

const BANKS = [
  { code: '0102', name: 'BANCO DE VENEZUELA' },
  { code: '0104', name: 'BANCO VENEZOLANO DE CREDITO' },
  { code: '0105', name: 'BANCO MERCANTIL' },
  { code: '0108', name: 'BBVA PROVINCIAL' },
  { code: '0114', name: 'BANCARIBE' },
  { code: '0115', name: 'BANCO EXTERIOR' },
  { code: '0128', name: 'BANCO CARONI' },
  { code: '0134', name: 'BANESCO' },
  { code: '0137', name: 'BANCO SOFITASA' },
  { code: '0138', name: 'BANCO PLAZA' },
  { code: '0146', name: 'BANGENTE' },
  { code: '0151', name: 'BANCO FONDO COMUN' },
  { code: '0156', name: '100% BANCO' },
  { code: '0157', name: 'DELSUR BANCO UNIVERSAL' },
  { code: '0163', name: 'BANCO DEL TESORO' },
  { code: '0168', name: 'BANCRECER' },
  { code: '0169', name: 'R4 BANCO MICROFINANCIERO C.A.' },
  { code: '0171', name: 'BANCO ACTIVO' },
  { code: '0172', name: 'BANCAMIGA BANCO UNIVERSAL, C.A.' },
  { code: '0173', name: 'BANCO INTERNACIONAL DE DESARROLLO' },
  { code: '0174', name: 'BANPLUS' },
  { code: '0175', name: 'BANCO DIGITAL DE LOS TRABAJADORES, BANCO UNIVERSAL' },
  { code: '0177', name: 'BANFANB' },
  { code: '0178', name: 'N58 BANCO DIGITAL BANCO MICROFINANCIERO S A' },
  { code: '0191', name: 'BANCO NACIONAL DE CREDITO' },
];

const getBankName = (code: string | null | undefined): string => {
  if (!code) return code || '';
  const bank = BANKS.find(b => b.code === code);
  return bank ? bank.name : code;
};

const statusMap = {
  pending: { label: "Pendiente", icon: Clock, color: "bg-yellow-500" },
  confirmed: { label: "Confirmado", icon: CheckCircle, color: "bg-blue-500" },
  preparing: { label: "Preparando", icon: Package, color: "bg-purple-500" },
  ready: { label: "Listo", icon: CheckCircle, color: "bg-green-500" },
  delivered: { label: "Entregado", icon: Truck, color: "bg-green-700" },
  cancelled: { label: "Cancelado", icon: XCircle, color: "bg-red-500" },
};

const ITEMS_PER_PAGE = 15;

export default function AdminOrders() {
  const { data: orders = [], isLoading, isFetching } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
    refetchInterval: 5000, // Actualizar cada 5 segundos
    refetchOnWindowFocus: true, // Actualizar cuando la ventana recupera el foco
    staleTime: 0, // Los datos siempre se consideran obsoletos para forzar actualización
  });

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  // Calcular paginación
  const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedOrders = orders.slice(startIndex, endIndex);

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      apiRequest(`/api/orders/${id}/status`, { method: 'PATCH', body: { status } }),
    onSuccess: () => {
      // Invalidar y refetch inmediatamente para mostrar los cambios
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.refetchQueries({ queryKey: ['/api/orders'] });
      toast({ title: "Estado actualizado" });
    },
  });

  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ id, paymentStatus }: { id: string; paymentStatus: string }) =>
      apiRequest(`/api/orders/${id}/payment`, { method: 'PATCH', body: { paymentStatus } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.refetchQueries({ queryKey: ['/api/orders'] });
      toast({ title: "Estado de pago actualizado" });
    },
  });

  const handleViewOrder = async (order: Order) => {
    setSelectedOrder(order);
    const items = await apiRequest(`/api/orders/${order.id}/items`);
    setOrderItems(items);
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateOrderStatusMutation.mutate({ id: orderId, status: newStatus });
  };

  const handlePrintTicket = (order: Order) => {
    // Crear una ventana nueva para imprimir
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const statusInfo = statusMap[order.status as keyof typeof statusMap] || statusMap.pending;
    const paymentStatusMap: Record<string, string> = {
      pending: 'No confirmado',
      approved: 'Aprobado',
      rejected: 'Rechazado',
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket de Pedido - ${order.customerName}</title>
          <style>
            @media print {
              @page {
                size: 58mm auto;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 5mm;
              }
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 11px;
              line-height: 1.3;
              margin: 0;
              padding: 5mm;
              max-width: 58mm;
            }
            .header {
              text-align: center;
              border-bottom: 2px dashed #000;
              padding-bottom: 8px;
              margin-bottom: 8px;
            }
            .header h1 {
              margin: 0;
              font-size: 14px;
              font-weight: bold;
            }
            .header p {
              margin: 2px 0 0 0;
              font-size: 10px;
            }
            .section {
              margin: 8px 0;
              padding: 4px 0;
              border-bottom: 1px dashed #ccc;
            }
            .section:last-child {
              border-bottom: none;
            }
            .section-title {
              font-weight: bold;
              font-size: 11px;
              margin-bottom: 4px;
              text-transform: uppercase;
            }
            .row {
              display: flex;
              justify-content: space-between;
              margin: 2px 0;
              font-size: 10px;
            }
            .label {
              font-weight: bold;
            }
            .value {
              text-align: right;
              word-break: break-word;
            }
            .total {
              font-size: 12px;
              font-weight: bold;
              margin-top: 8px;
              padding-top: 8px;
              border-top: 2px dashed #000;
            }
            .footer {
              text-align: center;
              margin-top: 10px;
              padding-top: 8px;
              border-top: 1px dashed #ccc;
              font-size: 9px;
            }
            .status-badge {
              display: inline-block;
              padding: 1px 6px;
              border-radius: 2px;
              font-size: 9px;
              font-weight: bold;
            }
            .status-pending { background: #fef3c7; }
            .status-approved { background: #d1fae5; }
            .status-rejected { background: #fee2e2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>FV FARMACIA</h1>
            <p>Ticket de Pedido</p>
          </div>

          <div class="section">
            <div class="section-title">Datos del Cliente</div>
            <div class="row">
              <span class="label">Nombre:</span>
              <span class="value">${order.customerName}</span>
            </div>
            <div class="row">
              <span class="label">Teléfono:</span>
              <span class="value">${order.customerPhone}</span>
            </div>
            ${order.customerEmail ? `
            <div class="row">
              <span class="label">Email:</span>
              <span class="value">${order.customerEmail}</span>
            </div>
            ` : ''}
            ${order.customerAddress ? `
            <div class="row">
              <span class="label">Dirección:</span>
              <span class="value">${order.customerAddress}</span>
            </div>
            ` : ''}
          </div>

          <div class="section">
            <div class="section-title">Información del Pedido</div>
            <div class="row">
              <span class="label">Fecha:</span>
              <span class="value">${new Date(order.createdAt).toLocaleString('es-ES')}</span>
            </div>
            <div class="row">
              <span class="label">Estado:</span>
              <span class="value">${statusInfo.label}</span>
            </div>
            <div class="row">
              <span class="label">ID Pedido:</span>
              <span class="value">${order.id.substring(0, 8)}...</span>
            </div>
          </div>

          ${(order.paymentBank || order.paymentCI || order.paymentPhone) ? `
          <div class="section">
            <div class="section-title">Datos de Pago</div>
            ${order.paymentBank ? `
            <div class="row">
              <span class="label">Banco:</span>
              <span class="value">${getBankName(order.paymentBank)}</span>
            </div>
            ` : ''}
            ${order.paymentCI ? `
            <div class="row">
              <span class="label">Documento:</span>
              <span class="value">${order.paymentCI}</span>
            </div>
            ` : ''}
            ${order.paymentPhone ? `
            <div class="row">
              <span class="label">Teléfono:</span>
              <span class="value">${order.paymentPhone}</span>
            </div>
            ` : ''}
            <div class="row">
              <span class="label">Estado de Pago:</span>
              <span class="value">
                <span class="status-badge status-${order.paymentStatus || 'pending'}">
                  ${paymentStatusMap[order.paymentStatus || 'pending']}
                </span>
              </span>
            </div>
          </div>
          ` : ''}

          ${order.notes ? `
          <div class="section">
            <div class="section-title">Notas</div>
            <p>${order.notes}</p>
          </div>
          ` : ''}

          <div class="section total">
            <div class="row">
              <span>Total en USD:</span>
              <span>$${parseFloat(order.total).toFixed(2)}</span>
            </div>
            ${order.totalInBolivares ? `
            <div class="row">
              <span>Total en Bs.:</span>
              <span>Bs. ${parseFloat(order.totalInBolivares).toLocaleString('es-VE', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}</span>
            </div>
            ` : ''}
          </div>

          <div class="footer">
            <p>Gracias por su compra</p>
            <p>${new Date().toLocaleString('es-ES')}</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Esperar a que se cargue el contenido y luego imprimir
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        // Cerrar la ventana después de imprimir (opcional)
        // printWindow.close();
      }, 250);
    };
  };

  if (isLoading) {
    return <div className="p-8 text-center">Cargando pedidos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-semibold">Gestión de Pedidos</h2>
          <p className="text-muted-foreground">Administra y actualiza el estado de los pedidos</p>
        </div>
        {isFetching && !isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Actualizando...</span>
          </div>
        )}
      </div>

      <div className="grid gap-4">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No hay pedidos registrados
            </CardContent>
          </Card>
        ) : (
          <>
            {paginatedOrders.map((order) => {
            const statusInfo = statusMap[order.status as keyof typeof statusMap] || statusMap.pending;
            const StatusIcon = statusInfo.icon;

            return (
              <Card key={order.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {order.customerName}
                      </CardTitle>
                      <CardDescription className="space-y-1">
                        <div>📞 {order.customerPhone}</div>
                        {order.customerEmail && <div>✉️ {order.customerEmail}</div>}
                        {order.customerAddress && <div>📍 {order.customerAddress}</div>}
                        <div className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleString('es-ES')}
                        </div>
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={`${statusInfo.color} text-white`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                      <div className="font-bold text-xl text-primary">
                        ${parseFloat(order.total).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select
                      value={order.status}
                      onValueChange={(value) => handleStatusChange(order.id, value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="confirmed">Confirmado</SelectItem>
                        <SelectItem value="preparing">Preparando</SelectItem>
                        <SelectItem value="ready">Listo</SelectItem>
                        <SelectItem value="delivered">Entregado</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrintTicket(order)}
                      title="Imprimir ticket del cliente"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewOrder(order)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver detalles
                    </Button>
                  </div>
                  {order.notes && (
                    <div className="mt-3 p-3 bg-muted rounded-md">
                      <p className="text-sm"><strong>Notas:</strong> {order.notes}</p>
                    </div>
                  )}

                  {/* Sección de Confirmación de Pago */}
                  {(order.paymentBank || order.paymentCI || order.paymentPhone) && (
                    <div className={`mt-4 p-4 rounded-md space-y-3 border ${
                      order.paymentStatus === 'approved' 
                        ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                        : order.paymentStatus === 'rejected'
                        ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                        : 'bg-muted border-border'
                    }`}>
                      <div className="flex items-center justify-between">
                        <h4 className={`font-semibold ${
                          order.paymentStatus === 'approved'
                            ? 'text-green-900 dark:text-green-100'
                            : order.paymentStatus === 'rejected'
                            ? 'text-red-900 dark:text-red-100'
                            : 'text-foreground'
                        }`}>
                          Datos de Confirmación de Pago
                        </h4>
                        <Select
                          value={order.paymentStatus || 'pending'}
                          onValueChange={(value) => {
                            updatePaymentStatusMutation.mutate({
                              id: order.id,
                              paymentStatus: value,
                            });
                          }}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">No confirmado</SelectItem>
                            <SelectItem value="approved">Aprobado</SelectItem>
                            <SelectItem value="rejected">Rechazado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 text-sm">
                        {order.paymentBank && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Banco emisor:</span>
                            <span className="font-medium">{getBankName(order.paymentBank)}</span>
                          </div>
                        )}
                        {order.paymentCI && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Documento afiliado:</span>
                            <span className="font-medium">{order.paymentCI}</span>
                          </div>
                        )}
                        {order.paymentPhone && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Telefono afiliado:</span>
                            <span className="font-medium">{order.paymentPhone}</span>
                          </div>
                        )}
                        {order.totalInBolivares && (
                          <div className={`flex justify-between pt-2 border-t ${
                            order.paymentStatus === 'approved'
                              ? 'border-green-200 dark:border-green-800'
                              : order.paymentStatus === 'rejected'
                              ? 'border-red-200 dark:border-red-800'
                              : 'border-border'
                          }`}>
                            <span className="text-muted-foreground">Total en Bs.:</span>
                            <span className={`font-bold text-lg ${
                              order.paymentStatus === 'approved'
                                ? 'text-green-700 dark:text-green-300'
                                : order.paymentStatus === 'rejected'
                                ? 'text-red-700 dark:text-red-300'
                                : 'text-foreground'
                            }`}>
                              Bs. {parseFloat(order.totalInBolivares).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1} - {Math.min(endIndex, orders.length)} de {orders.length} pedidos
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Mostrar solo algunas páginas alrededor de la actual
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="min-w-[40px]"
                        >
                          {page}
                        </Button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="px-2">...</span>;
                    }
                    return null;
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
          </>
        )}
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Pedido</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-1">Cliente</h4>
                  <p>{selectedOrder.customerName}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.customerPhone}</p>
                  {selectedOrder.customerEmail && (
                    <p className="text-sm text-muted-foreground">{selectedOrder.customerEmail}</p>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Fecha</h4>
                  <p>{new Date(selectedOrder.createdAt).toLocaleString('es-ES')}</p>
                </div>
              </div>

              {selectedOrder.customerAddress && (
                <div>
                  <h4 className="font-semibold mb-1">Dirección de entrega</h4>
                  <p>{selectedOrder.customerAddress}</p>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-2">Productos</h4>
                <div className="border rounded-md">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 border-b last:border-0">
                      <div className="flex-1">
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.measurementType === 'weight'
                            ? `${parseFloat(item.quantity) >= 1000 
                                ? `${(parseFloat(item.quantity) / 1000).toFixed(2)} kg` 
                                : `${item.quantity} g`}`
                            : `${item.quantity} unidad${parseFloat(item.quantity) > 1 ? 'es' : ''}`
                          }
                          {' @ '}${parseFloat(item.price).toFixed(2)}
                        </p>
                      </div>
                      <div className="font-semibold">
                        ${parseFloat(item.subtotal).toFixed(2)}
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center p-3 bg-muted font-bold">
                    <span>Total</span>
                    <span className="text-primary">${parseFloat(selectedOrder.total).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
