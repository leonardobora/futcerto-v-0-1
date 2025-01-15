import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserPlus } from "lucide-react";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RegisterModal = ({ isOpen, onClose }: RegisterModalProps) => {
  const [userType, setUserType] = useState<"player" | "manager" | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Aqui seria integrada a lógica de registro com backend
      console.log("Registrando usuário:", { ...formData, type: userType });
      
      toast({
        title: userType === "manager" 
          ? "Cadastro em análise"
          : "Cadastro realizado com sucesso!",
        description: userType === "manager"
          ? "Entraremos em contato em breve para confirmar seu cadastro."
          : "Você já pode fazer login no sistema.",
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Erro no cadastro",
        description: "Ocorreu um erro ao tentar realizar o cadastro.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cadastro FutCerto</DialogTitle>
          <DialogDescription>
            Escolha seu tipo de perfil e preencha seus dados
          </DialogDescription>
        </DialogHeader>

        {!userType ? (
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => setUserType("player")}
              variant="outline"
              className="h-32 flex flex-col gap-2"
            >
              <UserPlus className="h-8 w-8" />
              <span>Jogador</span>
            </Button>
            <Button
              onClick={() => setUserType("manager")}
              variant="outline"
              className="h-32 flex flex-col gap-2"
            >
              <UserPlus className="h-8 w-8" />
              <span>Gestor de Quadra</span>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setUserType(null)}>
                Voltar
              </Button>
              <Button type="submit">
                Cadastrar
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};