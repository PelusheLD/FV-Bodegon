import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Eye, Package, CheckCircle, XCircle, Clock, Truck } from "lucide-react";
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

const statusMap = {
  pending: { label: "Pendiente", icon: Clock, color: "bg-yellow-500" },
  confirmed: { label: "Confirmado", icon: CheckCircle, color: "bg-blue-500" },
  preparing: { label: "Preparando", icon: Package, color: "bg-purple-500" },
  ready: { label: "Listo", icon: CheckCircle, color: "bg-green-500" },
  delivered: { label: "Entregado", icon: Truck, color: "bg-green-700" },
  cancelled: { label: "Cancelado", icon: XCircle, color: "bg-red-500" },
};

export default function AdminOrders() {
  const { data: orders = [], isLoading, isFetching } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
    refetchInterval: 5000, // Actualizar cada 5 segundos
    refetchOnWindowFocus: true, // Actualizar cuando la ventana recupera el foco
    staleTime: 0, // Los datos siempre se consideran obsoletos para forzar actualización
  });

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const { toast } = useToast();

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
          orders.map((order) => {
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
                  <div className="flex items-center gap-2">
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
                            <span className="font-medium">{order.paymentBank}</span>
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
          })
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
