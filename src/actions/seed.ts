"use server";

import { db } from "@/db";
import {
  financialTransactions,
  orders,
  orderItems,
  inventoryTransactions,
  fieldActivities,
  plantings,
  poultryIndividuals,
  poultryBatches,
  inventoryItems,
  beds,
  fields,
  glebes,
  properties,
  customers,
  costCenters,
} from "@/db/schema";
import type { ActionResult } from "./topology";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function dateStr(n: number): string {
  return daysAgo(n).toISOString().split("T")[0];
}

export async function seedDatabase(): Promise<ActionResult<string>> {
  try {
    await db.delete(financialTransactions);
    await db.delete(orderItems);
    await db.delete(orders);
    await db.delete(inventoryTransactions);
    await db.delete(fieldActivities);
    await db.delete(plantings);
    await db.delete(poultryIndividuals);
    await db.delete(poultryBatches);
    await db.delete(inventoryItems);
    await db.delete(beds);
    await db.delete(fields);
    await db.delete(glebes);
    await db.delete(properties);
    await db.delete(customers);
    await db.delete(costCenters);

    await db.execute(`SELECT setval('properties_id_seq', 1, false)`);
    await db.execute(`SELECT setval('glebes_id_seq', 1, false)`);
    await db.execute(`SELECT setval('fields_id_seq', 1, false)`);
    await db.execute(`SELECT setval('beds_id_seq', 1, false)`);
    await db.execute(`SELECT setval('inventory_items_id_seq', 1, false)`);
    await db.execute(`SELECT setval('poultry_batches_id_seq', 1, false)`);
    await db.execute(`SELECT setval('poultry_individuals_id_seq', 1, false)`);
    await db.execute(`SELECT setval('plantings_id_seq', 1, false)`);
    await db.execute(`SELECT setval('field_activities_id_seq', 1, false)`);
    await db.execute(`SELECT setval('customers_id_seq', 1, false)`);
    await db.execute(`SELECT setval('orders_id_seq', 1, false)`);
    await db.execute(`SELECT setval('order_items_id_seq', 1, false)`);
    await db.execute(`SELECT setval('financial_transactions_id_seq', 1, false)`);
    await db.execute(`SELECT setval('inventory_transactions_id_seq', 1, false)`);
    await db.execute(`SELECT setval('cost_centers_id_seq', 1, false)`);

    const [ccVegetal] = await db
      .insert(costCenters)
      .values({
        name: "Vegetal",
        description: "Horta, SAF, Viveiro e Cultivos",
      })
      .returning();

    const [ccAvicultura] = await db
      .insert(costCenters)
      .values({
        name: "Avicultura",
        description: "Aviário, Lotes e Reprodução",
      })
      .returning();

    const [ccGeral] = await db
      .insert(costCenters)
      .values({
        name: "Infraestrutura Geral",
        description: "Despesas compartilhadas e administrativas",
      })
      .returning();

    const [prop] = await db
      .insert(properties)
      .values({
        name: "Sítio Micrantha",
        totalArea: "50000",
        unit: "m²",
      })
      .returning();

    const [glebaNorte] = await db
      .insert(glebes)
      .values({
        propertyId: prop.id,
        name: "Gleba Norte",
        area: "20000",
        description: "Área de cultivo principal e SAF",
      })
      .returning();

    const [glebaSul] = await db
      .insert(glebes)
      .values({
        propertyId: prop.id,
        name: "Gleba Sul",
        area: "30000",
        description: "Viveiro e compostagem",
      })
      .returning();

    const [talhaoSAF] = await db
      .insert(fields)
      .values({
        glebeId: glebaNorte.id,
        name: "Talhão SAF",
        area: "8000",
        description: "Sistema Agroflorestal",
      })
      .returning();

    const [talhaoHorta] = await db
      .insert(fields)
      .values({
        glebeId: glebaNorte.id,
        name: "Talhão Horta Intensiva",
        area: "5000",
        description: "Horta orgânica comercial",
      })
      .returning();

    const [talhaoViveiro] = await db
      .insert(fields)
      .values({
        glebeId: glebaSul.id,
        name: "Talhão Viveiro",
        area: "3000",
        description: "Produção de mudas",
      })
      .returning();

    const [talhaoCompostagem] = await db
      .insert(fields)
      .values({
        glebeId: glebaSul.id,
        name: "Talhão Compostagem",
        area: "2000",
        description: "Área de compostagem e bioinsumos",
      })
      .returning();

    const canteiros = await db
      .insert(beds)
      .values([
        { fieldId: talhaoSAF.id, name: "Linha Eucalipto", area: "500", description: "Eucalipto consorciado" },
        { fieldId: talhaoSAF.id, name: "Linha Frutíferas", area: "600", description: "Banana, mamão e citrus" },
        { fieldId: talhaoSAF.id, name: "Linha Café Sombreado", area: "400", description: "Café arábica sob árvores" },
        { fieldId: talhaoHorta.id, name: "Canteiro Rabanete", area: "50", description: "Ciclo rápido - 30 dias" },
        { fieldId: talhaoHorta.id, name: "Canteiro Alface", area: "80", description: "Alface crespa e lisa" },
        { fieldId: talhaoHorta.id, name: "Canteiro Cenoura", area: "60", description: "Cenoura orgânica" },
        { fieldId: talhaoHorta.id, name: "Canteiro Tomate", area: "100", description: "Tomate cereja estufado" },
        { fieldId: talhaoHorta.id, name: "Canteiro Ervas", area: "40", description: "Manjericão, hortelã, salsinha" },
        { fieldId: talhaoViveiro.id, name: "Canteiro Mudas Nativas", area: "200", description: "Ipê, aroeira, cedro" },
        { fieldId: talhaoViveiro.id, name: "Canteiro Estacas", area: "150", description: "Propagação vegetativa" },
      ])
      .returning();

    const [itemEstacaAmora] = await db
      .insert(inventoryItems)
      .values({
        name: "Estaca de Amora",
        unit: "unit",
        type: "final_product",
        category: "estaca",
        location: "Viveiro - Canteiro Estacas",
        basePrice: "5.00",
        costCenterId: ccVegetal.id,
      })
      .returning();

    const [itemSementeFeijao] = await db
      .insert(inventoryItems)
      .values({
        name: "Semente Feijão Guandu",
        unit: "kg",
        type: "final_product",
        category: "semente",
        location: "Gleba Sul - Armazém",
        basePrice: "15.00",
        costCenterId: ccVegetal.id,
      })
      .returning();

    const [itemOvos] = await db
      .insert(inventoryItems)
      .values({
        name: "Ovos",
        unit: "unit",
        type: "final_product",
        category: "insumo",
        location: "Aviário",
        basePrice: "12.00",
        costCenterId: ccAvicultura.id,
      })
      .returning();

    const [itemJADAM] = await db
      .insert(inventoryItems)
      .values({
        name: "Bioinsumo JADAM (JMS)",
        unit: "liters",
        type: "input",
        category: "insumo",
        location: "Compostagem - Galpão",
        costCenterId: ccVegetal.id,
      })
      .returning();

    const [itemRacao] = await db
      .insert(inventoryItems)
      .values({
        name: "Ração Postura",
        unit: "kg",
        type: "input",
        category: "insumo",
        location: "Aviário - Depósito",
        costCenterId: ccAvicultura.id,
      })
      .returning();

    const [lotePoedeiras] = await db
      .insert(poultryBatches)
      .values({
        name: "Lote Poedeiras Rústicas",
        breed: "Rhode Island Red",
        purpose: "postura",
        initialQuantity: 50,
        currentQuantity: 47,
        hatchDate: daysAgo(180),
      })
      .returning();

    const [loteRecria] = await db
      .insert(poultryBatches)
      .values({
        name: "Lote Recria",
        breed: "Pesadão Branco",
        purpose: "dupla_aptidao",
        initialQuantity: 100,
        currentQuantity: 98,
        hatchDate: daysAgo(45),
      })
      .returning();

    const [tita] = await db
      .insert(poultryIndividuals)
      .values({
        ringId: "RIR-2022-003",
        name: "Titã",
        gender: "macho",
        batchId: lotePoedeiras.id,
      })
      .returning();

    const [gaia] = await db
      .insert(poultryIndividuals)
      .values({
        ringId: "RIR-2022-007",
        name: "Gaia",
        gender: "femea",
        batchId: lotePoedeiras.id,
      })
      .returning();

    const [hercules] = await db
      .insert(poultryIndividuals)
      .values({
        ringId: "RIR-2023-015",
        name: "Hércules",
        gender: "macho",
        fatherId: tita.id,
        motherId: gaia.id,
        batchId: lotePoedeiras.id,
      })
      .returning();

    const [aurora] = await db
      .insert(poultryIndividuals)
      .values({
        ringId: "RIR-2023-022",
        name: "Aurora",
        gender: "femea",
        fatherId: tita.id,
        motherId: gaia.id,
        batchId: lotePoedeiras.id,
      })
      .returning();

    const [daffy] = await db
      .insert(poultryIndividuals)
      .values({
        ringId: "RIR-2024-001",
        name: "Daffy",
        gender: "macho",
        fatherId: hercules.id,
        motherId: aurora.id,
        batchId: lotePoedeiras.id,
      })
      .returning();

    await db.insert(plantings).values([
      { bedId: canteiros[0].id, itemId: itemSementeFeijao.id, status: "permanent", plantedAt: daysAgo(90) },
      { bedId: canteiros[1].id, itemId: itemSementeFeijao.id, status: "permanent", plantedAt: daysAgo(120) },
      { bedId: canteiros[3].id, itemId: itemSementeFeijao.id, status: "active", plantedAt: daysAgo(10) },
      { bedId: canteiros[4].id, itemId: itemSementeFeijao.id, status: "active", plantedAt: daysAgo(15) },
      { bedId: canteiros[5].id, itemId: itemSementeFeijao.id, status: "active", plantedAt: daysAgo(20) },
      { bedId: canteiros[8].id, itemId: itemSementeFeijao.id, status: "permanent", plantedAt: daysAgo(60) },
    ]);

    await db.insert(fieldActivities).values([
      { date: daysAgo(1), category: "aves", activityType: "coleta_ovos", batchId: lotePoedeiras.id, quantity: "30", notes: "Coleta matinal - ovos grandes" },
      { date: daysAgo(3), category: "aves", activityType: "coleta_ovos", batchId: lotePoedeiras.id, quantity: "28", notes: "Coleta matinal" },
      { date: daysAgo(5), category: "aves", activityType: "coleta_ovos", batchId: lotePoedeiras.id, quantity: "32", notes: "Coleta matinal - boa produção" },
      { date: daysAgo(4), category: "horta", activityType: "aplicacao_insumo", bedId: canteiros[3].id, itemId: itemJADAM.id, quantity: "2", notes: "Aplicação de JMS no rabanete" },
      { date: daysAgo(7), category: "horta", activityType: "plantio", bedId: canteiros[1].id, itemId: itemSementeFeijao.id, notes: "Plantio de frutíferas no SAF" },
      { date: daysAgo(6), category: "horta", activityType: "rocagem", bedId: canteiros[4].id, notes: "Roçagem entre canteiros de alface" },
      { date: daysAgo(8), category: "aves", activityType: "limpeza_aviario", batchId: lotePoedeiras.id, notes: "Troca de cama e limpeza de bebedouros" },
      { date: daysAgo(10), category: "aves", activityType: "coleta_esterco", batchId: lotePoedeiras.id, quantity: "15", notes: "Coleta de esterco para compostagem" },
      { date: daysAgo(12), category: "horta", activityType: "colheita", bedId: canteiros[3].id, itemId: itemSementeFeijao.id, quantity: "5", notes: "Colheita de rabanete - 5 kg" },
      { date: daysAgo(14), category: "geral", activityType: "rocagem", notes: "Roçagem geral da Gleba Norte" },
    ]);

    const [clienteB2B] = await db
      .insert(customers)
      .values({
        name: "Restaurante Central Guaíba",
        type: "b2b",
        email: "contato@centralguaiba.com.br",
        phone: "(51) 3333-4444",
        document: "12.345.678/0001-90",
      })
      .returning();

    const [clienteB2C1] = await db
      .insert(customers)
      .values({
        name: "Dona Maria",
        type: "b2c",
        phone: "(51) 99999-1234",
        document: "123.456.789-00",
      })
      .returning();

    const [clienteB2C2] = await db
      .insert(customers)
      .values({
        name: "Cliente Vizinho",
        type: "b2c",
        phone: "(51) 98888-5678",
      })
      .returning();

    const pedidos = [
      { date: daysAgo(1), customerId: clienteB2B.id, customerName: null, items: [{ itemId: itemOvos.id, quantity: "60", unitPrice: "12.00", totalPrice: "720.00", costCenterId: ccAvicultura.id }], paymentMethod: "pix" as const, paymentStatus: "pago" as const, type: "delivery" as const, deliveryFee: "5.00" },
      { date: daysAgo(2), customerId: clienteB2C1.id, customerName: null, items: [{ itemId: itemOvos.id, quantity: "12", unitPrice: "12.00", totalPrice: "144.00", costCenterId: ccAvicultura.id }], paymentMethod: "dinheiro" as const, paymentStatus: "pago" as const, type: "balcao" as const, deliveryFee: "0.00" },
      { date: daysAgo(3), customerId: clienteB2C2.id, customerName: null, items: [{ itemId: itemEstacaAmora.id, quantity: "20", unitPrice: "5.00", totalPrice: "100.00", costCenterId: ccVegetal.id }], paymentMethod: "pix" as const, paymentStatus: "pago" as const, type: "balcao" as const, deliveryFee: "0.00" },
      { date: daysAgo(5), customerId: clienteB2B.id, customerName: null, items: [{ itemId: itemSementeFeijao.id, quantity: "10", unitPrice: "15.00", totalPrice: "150.00", costCenterId: ccVegetal.id }], paymentMethod: "cartao" as const, paymentStatus: "pago" as const, type: "delivery" as const, deliveryFee: "8.00" },
      { date: daysAgo(7), customerId: null, customerName: "Feirante da Praça", items: [{ itemId: itemOvos.id, quantity: "24", unitPrice: "12.00", totalPrice: "288.00", costCenterId: ccAvicultura.id }], paymentMethod: "dinheiro" as const, paymentStatus: "pago" as const, type: "balcao" as const, deliveryFee: "0.00" },
      { date: daysAgo(10), customerId: clienteB2C1.id, customerName: null, items: [{ itemId: itemEstacaAmora.id, quantity: "10", unitPrice: "5.00", totalPrice: "50.00", costCenterId: ccVegetal.id }], paymentMethod: "pix" as const, paymentStatus: "pago" as const, type: "balcao" as const, deliveryFee: "0.00" },
      { date: daysAgo(0), customerId: clienteB2B.id, customerName: null, items: [{ itemId: itemOvos.id, quantity: "36", unitPrice: "12.00", totalPrice: "432.00", costCenterId: ccAvicultura.id }], paymentMethod: "pendente" as const, paymentStatus: "pendente" as const, type: "delivery" as const, deliveryFee: "5.00" },
      { date: daysAgo(4), customerId: clienteB2C2.id, customerName: null, items: [{ itemId: itemSementeFeijao.id, quantity: "5", unitPrice: "15.00", totalPrice: "75.00", costCenterId: ccVegetal.id }], paymentMethod: "pendente" as const, paymentStatus: "pendente" as const, type: "balcao" as const, deliveryFee: "0.00" },
      { date: daysAgo(6), customerId: null, customerName: "Turista", items: [{ itemId: itemEstacaAmora.id, quantity: "5", unitPrice: "5.00", totalPrice: "25.00", costCenterId: ccVegetal.id }], paymentMethod: "pendente" as const, paymentStatus: "pendente" as const, type: "balcao" as const, deliveryFee: "0.00" },
      { date: daysAgo(8), customerId: null, customerName: null, items: [{ itemId: itemOvos.id, quantity: "12", unitPrice: "12.00", totalPrice: "144.00", costCenterId: ccAvicultura.id }], paymentMethod: "pendente" as const, paymentStatus: "pendente" as const, type: "balcao" as const, deliveryFee: "0.00" },
    ];

    for (const p of pedidos) {
      const subtotal = p.items.reduce((sum, i) => sum + parseFloat(i.totalPrice), 0);
      const total = (subtotal + parseFloat(p.deliveryFee)).toFixed(2);

      const [newOrder] = await db
        .insert(orders)
        .values({
          date: p.date,
          customerId: p.customerId,
          customerName: p.customerName,
          type: p.type,
          paymentMethod: p.paymentMethod,
          paymentStatus: p.paymentStatus,
          deliveryFee: p.deliveryFee,
          subtotal: subtotal.toFixed(2),
          total,
        })
        .returning();

      for (const item of p.items) {
        await db.insert(orderItems).values({
          orderId: newOrder.id,
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        });
      }

      if (p.paymentStatus === "pago") {
        const customerLabel = p.customerId
          ? (p.customerId === clienteB2B.id ? "Restaurante Central Guaíba" : p.customerId === clienteB2C1.id ? "Dona Maria" : "Cliente Vizinho")
          : p.customerName || "Anônimo";

        const deliveryFeeNum = parseFloat(p.deliveryFee);
        const orderSubtotal = p.items.reduce((sum, i) => sum + parseFloat(i.totalPrice), 0);

        const byCenter = new Map<number, number>();
        for (const item of p.items) {
          const current = byCenter.get(item.costCenterId) || 0;
          byCenter.set(item.costCenterId, current + parseFloat(item.totalPrice));
        }

        for (const [ccId, itemTotal] of byCenter.entries()) {
          const ratio = orderSubtotal > 0 ? itemTotal / orderSubtotal : 0;
          const splitTotal = itemTotal + deliveryFeeNum * ratio;
          const centerName = ccId === ccAvicultura.id ? "Avicultura" : ccId === ccVegetal.id ? "Vegetal" : "Geral";

          await db.insert(financialTransactions).values({
            date: p.date,
            type: "revenue",
            category: "venda_producao",
            amount: splitTotal.toFixed(2),
            description: `Pedido #${newOrder.id} - Receita ${centerName} - ${customerLabel}`,
            orderId: newOrder.id,
            costCenterId: ccId,
          });
        }

        for (const item of p.items) {
          await db.insert(inventoryTransactions).values({
            itemId: item.itemId,
            type: "exit",
            quantity: item.quantity,
            date: p.date.toISOString().split("T")[0],
            notes: `Pedido #${newOrder.id}`,
          });
        }
      }
    }

    await db.insert(financialTransactions).values([
      { date: daysAgo(2), type: "expense", category: "infraestrutura", amount: "350.00", description: "Compra de Ferramentas (enxadas, podadores)", costCenterId: ccGeral.id },
      { date: daysAgo(5), type: "expense", category: "logistica", amount: "180.00", description: "Combustível Trator", costCenterId: ccVegetal.id },
      { date: daysAgo(9), type: "expense", category: "insumos_aves", amount: "220.00", description: "Ração para Aves - saco 50kg", costCenterId: ccAvicultura.id },
    ]);

    await db.insert(inventoryTransactions).values([
      { itemId: itemOvos.id, type: "entry", quantity: "500", date: dateStr(20), notes: "Produção acumulada do lote" },
      { itemId: itemEstacaAmora.id, type: "entry", quantity: "100", date: dateStr(15), notes: "Propagação no viveiro" },
      { itemId: itemSementeFeijao.id, type: "entry", quantity: "50", date: dateStr(25), notes: "Colheita anterior" },
      { itemId: itemJADAM.id, type: "entry", quantity: "20", date: dateStr(30), notes: "Produção de bioinsumo" },
      { itemId: itemRacao.id, type: "entry", quantity: "200", date: dateStr(10), notes: "Compra de ração" },
    ]);

    return { success: true, data: "Seed concluído com sucesso! Dados fictícios inseridos." };
  } catch (error) {
    return { success: false, error: `Erro ao executar seed: ${error instanceof Error ? error.message : "Erro desconhecido"}` };
  }
}

export async function clearDatabase(): Promise<ActionResult<string>> {
  try {
    await db.delete(financialTransactions);
    await db.delete(orderItems);
    await db.delete(orders);
    await db.delete(inventoryTransactions);
    await db.delete(fieldActivities);
    await db.delete(plantings);
    await db.delete(poultryIndividuals);
    await db.delete(poultryBatches);
    await db.delete(inventoryItems);
    await db.delete(customers);
    await db.delete(beds);
    await db.delete(fields);
    await db.delete(glebes);
    await db.delete(properties);
    await db.delete(costCenters);

    await db.execute(`SELECT setval('properties_id_seq', 1, false)`);
    await db.execute(`SELECT setval('glebes_id_seq', 1, false)`);
    await db.execute(`SELECT setval('fields_id_seq', 1, false)`);
    await db.execute(`SELECT setval('beds_id_seq', 1, false)`);
    await db.execute(`SELECT setval('inventory_items_id_seq', 1, false)`);
    await db.execute(`SELECT setval('poultry_batches_id_seq', 1, false)`);
    await db.execute(`SELECT setval('poultry_individuals_id_seq', 1, false)`);
    await db.execute(`SELECT setval('plantings_id_seq', 1, false)`);
    await db.execute(`SELECT setval('field_activities_id_seq', 1, false)`);
    await db.execute(`SELECT setval('customers_id_seq', 1, false)`);
    await db.execute(`SELECT setval('orders_id_seq', 1, false)`);
    await db.execute(`SELECT setval('order_items_id_seq', 1, false)`);
    await db.execute(`SELECT setval('financial_transactions_id_seq', 1, false)`);
    await db.execute(`SELECT setval('inventory_transactions_id_seq', 1, false)`);
    await db.execute(`SELECT setval('cost_centers_id_seq', 1, false)`);

    return { success: true, data: "Banco de dados zerado com sucesso! Todas as tabelas limpas e sequences resetadas." };
  } catch (error) {
    return { success: false, error: `Erro ao zerar banco: ${error instanceof Error ? error.message : "Erro desconhecido"}` };
  }
}
