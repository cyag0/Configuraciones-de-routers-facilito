import {
  ProForm,
  ProFormDigit,
  ProFormList,
  ProFormText,
  ProFormDependency,
  ProFormSelect,
  ProFormSwitch,
} from "@ant-design/pro-components";
import {
  Card,
  Checkbox,
  Col,
  Divider,
  Empty,
  Flex,
  Form,
  Row,
  Table,
  Typography,
  message,
} from "antd";
import { calculateSubnets, Subnet } from "./utils/ip";
import { useRef, useState } from "react";
import { CopyIcon } from "./const/icons";
import { MessageInstance } from "antd/es/message/interface";

type RoutersConnected = {
  [router_id: string]: {
    interface: Interfaces;
    network: string;
    mask: number;
    ipAddress: string; // 10.0.0.1
  };
};

type Routers = {
  [router_id: string]: Router;
};

type Router = {
  id: string;
  name: string;
  routers_connected: RoutersConnected;
  interface_used: Interfaces[];
  dhcp?: Subnet[];
  static_ips_quantity?: number;
  protocol?: "rip" | "ospf" | "eigrp";
  as_number?: number;
};

type Interfaces = "s0/0/0" | "s0/0/1" | "s0/1/0" | "s0/1/1";

type OnFinishValues = {
  network: string;
  quantity: number;
  subnet_mask: string;
  subnet_mask_new: string;
  protocol: "rip" | "ospf" | "eigrp";
  as_number: number;
  dhcp: boolean;
  static_ips: boolean;
  static_ips_quantity: number;
  routers: RouterSelected[];
};

type RouterSelected = {
  id: string;
  name: string;
  routers_used: string[];
};

const interfaces = ["s0/0/0", "s0/0/1", "s0/1/0", "s0/1/1"] as Interfaces[];

function App() {
  const [form] = Form.useForm();

  const routers = Form.useWatch("routers", form) as RouterSelected[];
  const [router, setRouter] = useState<Routers | undefined>(undefined);

  const [messageApi, contextHolder] = message.useMessage();

  function onFinish(values: OnFinishValues) {
    const networks = calculateSubnets(
      values.network,
      parseInt(values.subnet_mask),
      parseInt(values.subnet_mask_new)
    );

    console.log(networks);

    const routersConfiguration: Routers = {};
    let currentNetworkIndex = 0;

    values.routers.forEach((router) => {
      const routersConnected = {} as RoutersConnected;
      const interfacesUsed = [] as Interfaces[];

      router.routers_used.forEach((routerId, index) => {
        const _interfaceUsed = interfaces[index] as Interfaces;

        if (!_interfaceUsed) return;

        interfacesUsed.push(_interfaceUsed);
        if (routersConfiguration[routerId]) {
          const prevConnection =
            routersConfiguration[routerId].routers_connected[router.id];
          const prevIp = prevConnection.ipAddress.split(".");

          // todo tenemos que incrementar segun la mascara de red
          const newIp = `${prevIp[0]}.${prevIp[1]}.${prevIp[2]}.${
            parseInt(prevIp[3]) + 1
          }`;

          routersConnected[routerId] = {
            interface: _interfaceUsed,
            network: prevConnection.network,
            mask: networks[index].mask,
            ipAddress: newIp,
          };
        } else {
          routersConnected[routerId] = {
            interface: _interfaceUsed,
            network: networks[currentNetworkIndex].network,
            mask: networks[currentNetworkIndex].mask,
            ipAddress: networks[currentNetworkIndex].firstAddress,
          };

          currentNetworkIndex++;
        }
      });

      routersConfiguration[router.id] = {
        id: router.id,
        name: router.name,
        routers_connected: routersConnected,
        interface_used: interfacesUsed,
        dhcp: values.dhcp
          ? [networks[currentNetworkIndex], networks[currentNetworkIndex + 1]]
          : [],
        static_ips_quantity: values.static_ips_quantity,
        protocol: values.protocol,
        as_number: values.as_number,
      };

      currentNetworkIndex += 2;
    });

    setRouter(routersConfiguration);

    messageApi.success("Configuraciones generadas correctamente");
  }

  return (
    <Flex justify="center" className="bg-gray-200 min-h-screen" align="center">
      {contextHolder}
      <div className="my-16 max-w-3xl">
        <Card
          title={"Configuracion de routers facilito"}
          className="p-8 w-full"
        >
          <ProForm
            submitter={{
              searchConfig: {
                submitText: "Generar configuracion",
                resetText: "Limpiar",
              },
            }}
            initialValues={
              {
                /*  network: "10.0.0.0",
              quantity: 3,
              subnet_mask: "8",
              subnet_mask_new: "24",
              protocol: "rip",
              as_number: 1,
              dhcp: false,
              static_ips: false,
              static_ips_quantity: 0,
              routers: [
                {
                  id: "router_1",
                  name: "Router 1",
                  routers_used: ["router_2", "router_3"],
                },
                {
                  id: "router_2",
                  name: "Router 2",
                  routers_used: ["router_1", "router_3"],
                },
                {
                  id: "router_3",
                  name: "Router 3",
                  routers_used: ["router_1", "router_2"],
                },
              ], */
              }
            }
            form={form}
            onFinish={onFinish}
          >
            <Row gutter={16}>
              <Col span={18}>
                <ProFormText
                  placeholder={"Ej. 10.0.0.0"}
                  rules={[
                    {
                      required: true,
                      message: "Por favor ingrese la direccion de red",
                    },
                  ]}
                  name="network"
                  label="Direccion de red"
                />
              </Col>
              <Col span={6}>
                {/* cantiudad de routers numeric input */}
                <ProFormDigit
                  placeholder={"Ej. 3"}
                  rules={[
                    {
                      required: true,
                      message: "Por favor ingrese la cantidad de routers",
                    },
                  ]}
                  name="quantity"
                  fieldProps={{
                    onChange: (value) => {
                      if (!value) return;
                      form.setFieldsValue({
                        routers: Array.from({ length: value }).map(
                          (_, index) => {
                            return {
                              id: `router_${index + 1}`,
                              name: `Router ${index + 1}`,
                              routers: [],
                            };
                          }
                        ),
                      });
                    },
                  }}
                  label="Cantidad de routers"
                />
              </Col>
              <Col span={12}>
                <ProFormDigit
                  placeholder={"Ej. 8"}
                  rules={[
                    {
                      required: true,
                      message: "Por favor ingrese la direccion de red",
                    },
                  ]}
                  name="subnet_mask"
                  label="Mascara de subred original"
                />
              </Col>
              <Col span={12}>
                <ProFormDigit
                  placeholder={"Ej. 24"}
                  rules={[
                    {
                      required: true,
                      message: "Por favor ingrese la nueva mascara de subred",
                    },
                  ]}
                  name="subnet_mask_new"
                  label="Nueva mascara de subred"
                />
              </Col>

              <Col span={18}>
                <ProFormSelect
                  placeholder={"Seleccione un protocolo"}
                  rules={[
                    {
                      required: true,
                      message:
                        "Por favor seleccione el protocolo de enrutamiento",
                    },
                  ]}
                  name="protocol"
                  label="Protocolo de enrutamiento"
                  options={[
                    {
                      label: "RIP",
                      value: "rip",
                    },
                    {
                      label: "OSPF",
                      value: "ospf",
                    },
                    {
                      label: "EIGRP",
                      value: "eigrp",
                    },
                  ]}
                />
              </Col>

              <ProFormDependency name={["protocol"]}>
                {({ protocol }) => {
                  if (!protocol || protocol === "rip") return null;

                  return (
                    <Col span={6}>
                      <ProFormText
                        placeholder={"Ej. 364"}
                        rules={[
                          {
                            required: true,
                            message: "Por favor ingrese el numero de AS",
                          },
                        ]}
                        name="as_number"
                        label="Numero de control"
                      />
                    </Col>
                  );
                }}
              </ProFormDependency>
              <Col span={24}>
                <ProFormSwitch name={"dhcp"} label={"Activar DHCP"} />
              </Col>
              <Col span={8}>
                <ProFormSwitch
                  name={"static_ips"}
                  label={"Crear ips estaticos"}
                />
              </Col>
              <ProFormDependency name={["static_ips"]}>
                {({ static_ips }) => {
                  if (!static_ips) return null;

                  return (
                    <Col span={16}>
                      <ProFormDigit
                        rules={[
                          {
                            required: true,
                            message: "Por favor la cantidad de ips estaticas",
                          },
                        ]}
                        name="static_ips_quantity"
                        label="Cantidad de ips estaticas"
                        placeholder={"Insertar valor"}
                      />
                    </Col>
                  );
                }}
              </ProFormDependency>
            </Row>

            {/* Usando pro form list  y proformdependency crea una lista de routers dependiendo de los routers que se ingreos */}
            <ProFormList
              name="routers"
              label="Routers"
              containerClassName="w-full"
              emptyListMessage="Por favor ingrese la cantidad de routers"
              deleteIconProps={false} // Deshabilitar el botón para evitar eliminar manualmente
              creatorButtonProps={false} // Deshabilitar el botón para evitar agregar manualmente
              copyIconProps={false} // Deshabilitar el botón para evitar copiar manualmente
            >
              {(fields) => {
                return (
                  <Row gutter={16}>
                    <ProFormText name="id" hidden />
                    <Col span={6}>
                      <ProFormText
                        rules={[
                          {
                            required: true,
                            message: "Por favor ingrese un nombre",
                          },
                        ]}
                        name={"name"}
                        placeholder="Ej. Router A"
                        label={"Nombre del router"}
                      />
                    </Col>
                    <Col span={18}>
                      <ProFormSelect
                        required
                        name={"routers_used"}
                        rules={[
                          {
                            required: true,
                            message: "Por favor seleccione un router",
                          },
                        ]}
                        placeholder={"Seleccione un router"}
                        label={"Routers conectados a este router"}
                        fieldProps={{
                          maxTagCount: 4,
                          maxTagPlaceholder: "Maximo 4 routers",
                        }}
                        options={(() => {
                          if (!routers) return [];

                          const value =
                            form.getFieldValue("routers")[fields.key]?.id;

                          return routers
                            .filter((router) => router.id !== value)
                            .map((router) => {
                              return {
                                label: router.name,
                                value: router.id,
                              };
                            });
                        })()}
                        mode="multiple"
                      />
                    </Col>
                  </Row>
                );
              }}
            </ProFormList>

            <ProFormDependency name={["quantity"]}>
              {({ quantity }) => {
                if (!quantity || quantity === 0)
                  return <Empty description="Pon routers pa" />;
              }}
            </ProFormDependency>
          </ProForm>
        </Card>

        <Divider />

        {Object.values(router || {}).length > 0 && (
          <Card className="mt-8 p-8">
            <Typography.Title level={4}>
              Configuracion de routers
            </Typography.Title>

            {/* Tabla de direccionamiento */}

            <Table
              className="my-4"
              pagination={false}
              dataSource={Object.values(router || {})}
              columns={[
                //router name, network, mask converter, interface, router conected name, ip address
                {
                  title: "Router",
                  dataIndex: "name",
                  key: "name",
                },
                {
                  title: "Network",
                  dataIndex: "routers_connected",
                  key: "routers_connected",
                  render: (routers_connected: RoutersConnected) => {
                    return Object.values(routers_connected).map(
                      (connection) => {
                        return <div className="p-2">{connection.network}</div>;
                      }
                    );
                  },
                },
                {
                  title: "Interface",
                  dataIndex: "interface_used",
                  key: "interface_used",
                  render: (interface_used: Interfaces[]) => {
                    return interface_used.map((interfaceUsed) => {
                      return <div className="p-2">{interfaceUsed}</div>;
                    });
                  },
                },
                {
                  title: "Dispositivos conectados",
                  dataIndex: "routers_connected",
                  key: "routers_connected",
                  render: (routers_connected: RoutersConnected) => {
                    return Object.keys(routers_connected).map((connection) => {
                      const name = router![connection].name;
                      return <div className="p-2">{name}</div>;
                    });
                  },
                },
                {
                  title: "IP Address",
                  dataIndex: "routers_connected",
                  key: "routers_connected",
                  render: (routers_connected: RoutersConnected, _router) => {
                    return Object.keys(routers_connected).map((routerId) => {
                      const connection =
                        router![routerId].routers_connected[_router!.id] || {};
                      return (
                        <div className="p-2">
                          {connection.interface || "Nulo corregir"}
                        </div>
                      );
                    });
                  },
                },

                {
                  title: "Interfaz 2",
                  dataIndex: "routers_connected",
                  key: "routers_connected",
                  render: (routers_connected: RoutersConnected) => {
                    return Object.values(routers_connected).map(
                      (connection) => {
                        return (
                          <div className="p-2">{connection.ipAddress}</div>
                        );
                      }
                    );
                  },
                },

                {
                  title: "Check",
                  dataIndex: "routers_connected",
                  key: "checkbox",
                  render: () => {
                    return <Checkbox />;
                  },
                },
              ]}
            />

            {Object.keys(router || {}).map((routerId) => {
              return (
                <RoutersConfiguration
                  messageApi={messageApi}
                  router={router![routerId]}
                />
              );
            })}
          </Card>
        )}
      </div>
    </Flex>
  );
}

type RoutersConfiguration = {
  router: Router;
  messageApi: MessageInstance;
};

function RoutersConfiguration(props: RoutersConfiguration) {
  if (!props.router) return <Empty description="No hay routers configurados" />;

  const copyRef = useRef<HTMLButtonElement>(null);

  const networks = (() => {
    const networks: {
      network: string;
      mask: string;
    }[] = Object.values(props.router.routers_connected).map((connection) => {
      return {
        network: connection.network,
        mask: convertMask(connection.mask),
      };
    });

    if (props.router.dhcp) {
      props.router.dhcp.forEach((dhcp) => {
        networks.push({
          network: dhcp.network,
          mask: convertMask(dhcp.mask),
        });
      });
    }

    return networks;
  })();

  return (
    <div
      className="bg-gray-900 p-4 my-4 rounded-lg text-white"
      key={props.router.id}
    >
      <Flex justify="space-between" align="center">
        <Typography.Title
          style={{
            color: "white",
            fontWeight: "bold",
          }}
          level={5}
        >
          {props.router.name}
        </Typography.Title>
        <button
          onClick={() => {
            if (!copyRef.current) return;

            const range = document.createRange();
            range.selectNode(copyRef.current);
            window.getSelection()?.removeAllRanges();
            window.getSelection()?.addRange(range);

            try {
              document.execCommand("copy");
              window.getSelection()?.removeAllRanges();
              props.messageApi.success("Configuracion copiada al portapapeles");
            } catch (err) {
              console.error("Error al copiar al portapapeles", err);
            }
          }}
          className="bg-gray-800 p-2 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors duration-150"
        >
          <CopyIcon className="text-white" />
        </button>
      </Flex>

      <code ref={copyRef}>
        enable <br />
        config terminal <br /> <br />
        hostname {props.router.name.replace(/\s/g, "_")} <br />
        #configuracion de las interfaces <br /> <br />
        {Object.keys(props.router.routers_connected || []).map((routerId) => {
          const connection = props.router.routers_connected[routerId];
          const interfaceUsed = connection.interface;

          return (
            <>
              interface {interfaceUsed} <br />
              ip address {connection.ipAddress} {convertMask(connection.mask)}
              <br />
              no shutdown <br />
              exit <br /> <br />
            </>
          );
        })}
        {props.router.dhcp &&
          props.router.dhcp.length > 0 &&
          props.router.dhcp.map((dhcp, index) => {
            return (
              <>
                interface gi0/{index} <br />
                ip address {dhcp.firstAddress} {convertMask(dhcp.mask)} <br />
                no shutdown <br /> exit <br /> <br /> ip dhcp pool lan_
                {index + 1}
                <br />
                network {dhcp.network} {convertMask(dhcp.mask)} <br />
                default-router {dhcp.firstAddress} <br /> <br />
              </>
            );
          })}
        {/* Procotol */}
        {props.router.protocol && (
          <>
            router {props.router.protocol} {props.router.as_number || ""} <br />
            {props.router.protocol === "rip" && (
              <>
                version 2 <br />
              </>
            )}
            {networks.map((network) => {
              return (
                <>
                  network {network.network}{" "}
                  {props.router.protocol !== "rip" &&
                    calculateWildcard(network.mask)}{" "}
                  {props.router.protocol === "ospf" && "area 0"} <br />
                </>
              );
            })}
          </>
        )}
      </code>
    </div>
  );
}

function calculateWildcard(mask: string = "255.255.255.0") {
  const maskOctets = mask.split(".").map((octet) => parseInt(octet));
  const wildcard = maskOctets.map((octet) => 255 - octet);

  return wildcard.join(".");
}

// funcion para convertir mascara de red de 24 a 255.255.255.0
function convertMask(mask: number): string {
  const maskBits = Array(32)
    .fill(0)
    .map((_, i) => (i < mask ? 1 : 0));
  const maskOctets = [];

  for (let i = 0; i < 4; i++) {
    const octet = maskBits.slice(i * 8, (i + 1) * 8).join("");
    maskOctets.push(parseInt(octet, 2));
  }

  return maskOctets.join(".");
}

export default App;
